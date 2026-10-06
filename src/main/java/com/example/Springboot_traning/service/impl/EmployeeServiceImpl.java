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
    public EmployeeServiceImpl(EmployeeRepository employeeRepository,
                               DepartmentRepository departmentRepository,
                               EmployeeProfileRepository profileRepository) {
        this.employeeRepository  = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.profileRepository   = profileRepository;
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
        return toResponse(saved);
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
