package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.dto.request.CreateEmployeeRequest;
import com.example.Springboot_traning.dto.request.EmployeeProfileRequest;
import com.example.Springboot_traning.dto.request.UpdateEmployeeRequest;
import com.example.Springboot_traning.dto.response.DepartmentResponse;
import com.example.Springboot_traning.dto.response.EmployeeProfileResponse;
import com.example.Springboot_traning.dto.response.EmployeeResponse;
import com.example.Springboot_traning.entity.Department;
import com.example.Springboot_traning.entity.Employee;
import com.example.Springboot_traning.entity.EmployeeProfile;
import com.example.Springboot_traning.exception.DuplicateResourceException;
import com.example.Springboot_traning.exception.ResourceNotFoundException;
import com.example.Springboot_traning.repository.DepartmentRepository;
import com.example.Springboot_traning.repository.EmployeeProfileRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import com.example.Springboot_traning.service.EmployeeService;
import com.example.Springboot_traning.service.KeycloakAdminService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeProfileRepository profileRepository;
    private final KeycloakAdminService keycloakAdminService;

    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               DepartmentRepository departmentRepository,
                               EmployeeProfileRepository profileRepository,
                               KeycloakAdminService keycloakAdminService) {
        this.employeeRepository  = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.profileRepository   = profileRepository;
        this.keycloakAdminService = keycloakAdminService;
    }

    @Override
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {

        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Employee", "email", request.getEmail());
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department", "id", request.getDepartmentId()));

        Employee employee = Employee.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .salary(request.getSalary())
                .department(department)
                .build();

        Employee saved = employeeRepository.save(employee);

        // Derive username & generate temporary password
        String username = request.getEmail().contains("@")
                ? request.getEmail().substring(0, request.getEmail().indexOf('@')).toLowerCase().replaceAll("[^a-z0-9_]", "_")
                : (request.getFirstName().toLowerCase() + "_" + request.getLastName().toLowerCase());
        String tempPassword = "Emp@" + (new java.util.Random().nextInt(9000) + 1000) + "!";

        try {
            keycloakAdminService.provisionUser(
                    username,
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    tempPassword,
                    "USER"
            );
        } catch (Exception ex) {
            System.err.println("[WARN] Keycloak user auto-provision failed: " + ex.getMessage());
        }

        EmployeeResponse response = toResponse(saved);
        response.setUsername(username);
        response.setTemporaryPassword(tempPassword);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
        return toResponse(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeResponse> getAllEmployees(String department, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName").ascending());
        Page<Employee> employees = employeeRepository.findByOptionalDepartment(department, pageable);
        return employees.map(this::toResponse);
    }

    @Override
    public EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        if (request.getFirstName() != null) employee.setFirstName(request.getFirstName());
        if (request.getLastName()  != null) employee.setLastName(request.getLastName());
        if (request.getSalary()    != null) employee.setSalary(request.getSalary());

        if (request.getEmail() != null && !request.getEmail().equals(employee.getEmail())) {
            if (employeeRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("Employee", "email", request.getEmail());
            }
            employee.setEmail(request.getEmail());
        }

        if (request.getDepartmentId() != null) {
            Department newDept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Department", "id", request.getDepartmentId()));
            employee.setDepartment(newDept);
        }

        return toResponse(employeeRepository.save(employee));
    }

    @Override
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));

        employeeRepository.delete(employee);
    }

    @Override
    public EmployeeProfileResponse createOrUpdateProfile(Long employeeId, EmployeeProfileRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employeeId));

        EmployeeProfile profile = profileRepository.findByEmployee_Id(employeeId)
                .orElse(EmployeeProfile.builder().employee(employee).build());

        if (request.getPhone()       != null) profile.setPhone(request.getPhone());
        if (request.getAddress()     != null) profile.setAddress(request.getAddress());
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());

        return toProfileResponse(profileRepository.save(profile));
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeProfileResponse getProfile(Long employeeId) {

        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee", "id", employeeId);
        }
        EmployeeProfile profile = profileRepository.findByEmployee_Id(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "EmployeeProfile", "employeeId", employeeId));
        return toProfileResponse(profile);
    }

    private Employee resolveEmployee(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new ResourceNotFoundException("Employee", "username", "anonymous");
        }
        // 1. Direct email match
        var emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail);
        if (emp.isPresent()) return emp.get();

        // 2. Search by identifier (username, first name, full name)
        var matches = employeeRepository.searchByIdentifier(usernameOrEmail);
        if (!matches.isEmpty()) return matches.get(0);

        // 3. Match common domain suffixes
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@company.com");
        if (emp.isPresent()) return emp.get();
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@springboot.com");
        if (emp.isPresent()) return emp.get();
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@workforce.local");
        if (emp.isPresent()) return emp.get();

        // 4. Auto-provision distinct employee for authenticated user if missing
        Department defaultDept = departmentRepository.findAll().stream().findFirst()
                .orElseGet(() -> departmentRepository.save(Department.builder().name("Administration").location("Headquarters").build()));

        String cleanName = usernameOrEmail.contains("@") ? usernameOrEmail.substring(0, usernameOrEmail.indexOf('@')) : usernameOrEmail;
        cleanName = Character.toUpperCase(cleanName.charAt(0)) + cleanName.substring(1).replace('_', ' ');

        return employeeRepository.save(Employee.builder()
                .firstName(cleanName)
                .lastName("Account")
                .email(usernameOrEmail.contains("@") ? usernameOrEmail : usernameOrEmail + "@springboot.com")
                .salary(java.math.BigDecimal.valueOf(75000.00))
                .department(defaultDept)
                .build());
    }

    @Override
    @Transactional
    public EmployeeResponse getMyEmployee(String usernameOrEmail) {
        Employee employee = resolveEmployee(usernameOrEmail);
        return toResponse(employee);
    }

    @Override
    public EmployeeResponse updateMyProfile(String usernameOrEmail, EmployeeProfileRequest request) {
        Employee employee = resolveEmployee(usernameOrEmail);
        createOrUpdateProfile(employee.getId(), request);
        Employee updated = employeeRepository.findById(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", employee.getId()));
        return toResponse(updated);
    }

    private EmployeeResponse toResponse(Employee e) {
        EmployeeProfileResponse profileResponse = (e.getProfile() != null)
                ? toProfileResponse(e.getProfile()) : null;

        DepartmentResponse deptResponse = (e.getDepartment() != null)
                ? DepartmentResponse.builder()
                    .id(e.getDepartment().getId())
                    .name(e.getDepartment().getName())
                    .location(e.getDepartment().getLocation())
                    .build()
                : null;

        return EmployeeResponse.builder()
                .id(e.getId())
                .firstName(e.getFirstName())
                .lastName(e.getLastName())
                .email(e.getEmail())
                .salary(e.getSalary())

                .department(deptResponse)
                .profile(profileResponse)
                .build();
    }

    private EmployeeProfileResponse toProfileResponse(EmployeeProfile p) {
        return EmployeeProfileResponse.builder()
                .id(p.getId())
                .phone(p.getPhone())
                .address(p.getAddress())
                .dateOfBirth(p.getDateOfBirth())
                .build();
    }
}
