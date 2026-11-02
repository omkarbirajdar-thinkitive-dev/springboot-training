package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.dto.request.CreateAllowanceRequest;
import com.example.Springboot_traning.dto.request.UpdateAllowanceRequest;
import com.example.Springboot_traning.dto.response.AllowanceResponse;
import com.example.Springboot_traning.entity.Allowance;
import com.example.Springboot_traning.entity.Employee;
import com.example.Springboot_traning.exception.ResourceNotFoundException;
import com.example.Springboot_traning.repository.AllowanceRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import com.example.Springboot_traning.service.AllowanceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class AllowanceServiceImpl implements AllowanceService {

    private final AllowanceRepository allowanceRepository;
    private final EmployeeRepository employeeRepository;

    public AllowanceServiceImpl(AllowanceRepository allowanceRepository,
                                EmployeeRepository employeeRepository) {
        this.allowanceRepository = allowanceRepository;
        this.employeeRepository = employeeRepository;
    }

    private Employee resolveEmployee(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new ResourceNotFoundException("Employee", "username", "anonymous");
        }
        Optional<Employee> emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail);
        if (emp.isPresent()) return emp.get();

        var matches = employeeRepository.searchByIdentifier(usernameOrEmail);
        if (!matches.isEmpty()) return matches.get(0);

        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@company.com");
        if (emp.isPresent()) return emp.get();
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@springboot.com");
        if (emp.isPresent()) return emp.get();
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@workforce.local");
        if (emp.isPresent()) return emp.get();

        throw new ResourceNotFoundException("Employee", "user", usernameOrEmail);
    }

    @Override
    public AllowanceResponse createAllowance(CreateAllowanceRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));

        Allowance allowance = Allowance.builder()
                .employee(employee)
                .type(request.getType())
                .amount(request.getAmount())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .description(request.getDescription())
                .build();

        Allowance saved = allowanceRepository.save(allowance);
        return mapToResponse(saved);
    }

    @Override
    public AllowanceResponse updateAllowance(Long id, UpdateAllowanceRequest request) {
        Allowance allowance = allowanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Allowance", "id", id));

        allowance.setType(request.getType());
        allowance.setAmount(request.getAmount());
        allowance.setEffectiveFrom(request.getEffectiveFrom());
        allowance.setEffectiveTo(request.getEffectiveTo());
        allowance.setDescription(request.getDescription());

        Allowance saved = allowanceRepository.save(allowance);
        return mapToResponse(saved);
    }

    @Override
    public void deleteAllowance(Long id) {
        Allowance allowance = allowanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Allowance", "id", id));
        allowanceRepository.delete(allowance);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AllowanceResponse> getMyAllowances(String usernameOrEmail) {
        Employee employee = resolveEmployee(usernameOrEmail);
        return allowanceRepository.findByEmployeeIdOrderByEffectiveFromDesc(employee.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AllowanceResponse> getAllowancesByEmployee(Long employeeId) {
        return allowanceRepository.findByEmployeeIdOrderByEffectiveFromDesc(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AllowanceResponse> filterAllowances(Long employeeId, Pageable pageable) {
        return allowanceRepository.filterAllowances(employeeId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AllowanceResponse getAllowanceById(Long id) {
        Allowance allowance = allowanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Allowance", "id", id));
        return mapToResponse(allowance);
    }

    private AllowanceResponse mapToResponse(Allowance allowance) {
        Employee emp = allowance.getEmployee();
        String empName = emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown";
        String empEmail = emp != null ? emp.getEmail() : "";
        String deptName = (emp != null && emp.getDepartment() != null) ? emp.getDepartment().getName() : "";

        return AllowanceResponse.builder()
                .id(allowance.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(empName)
                .employeeEmail(empEmail)
                .departmentName(deptName)
                .type(allowance.getType())
                .amount(allowance.getAmount())
                .effectiveFrom(allowance.getEffectiveFrom())
                .effectiveTo(allowance.getEffectiveTo())
                .description(allowance.getDescription())
                .createdAt(allowance.getCreatedAt())
                .build();
    }
}
