package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.dto.request.GeneratePayslipRequest;
import com.example.Springboot_traning.dto.response.PayslipResponse;
import com.example.Springboot_traning.entity.Employee;
import com.example.Springboot_traning.entity.Payslip;
import com.example.Springboot_traning.entity.PayslipStatus;
import com.example.Springboot_traning.exception.ResourceNotFoundException;
import com.example.Springboot_traning.repository.AllowanceRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import com.example.Springboot_traning.repository.PayslipRepository;
import com.example.Springboot_traning.service.PayrollService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PayrollServiceImpl implements PayrollService {

    private final PayslipRepository payslipRepository;
    private final EmployeeRepository employeeRepository;
    private final AllowanceRepository allowanceRepository;

    public PayrollServiceImpl(PayslipRepository payslipRepository,
                              EmployeeRepository employeeRepository,
                              AllowanceRepository allowanceRepository) {
        this.payslipRepository = payslipRepository;
        this.employeeRepository = employeeRepository;
        this.allowanceRepository = allowanceRepository;
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
    public List<PayslipResponse> generatePayslips(GeneratePayslipRequest request, String adminUsername) {
        List<Employee> targetEmployees = new ArrayList<>();
        if (request.getEmployeeId() != null) {
            Employee emp = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", request.getEmployeeId()));
            targetEmployees.add(emp);
        } else {
            targetEmployees = employeeRepository.findAll();
        }

        LocalDate calculationDate = LocalDate.of(request.getYear(), request.getMonth(), 1);
        PayslipStatus initialStatus = Boolean.TRUE.equals(request.getPublishImmediately())
                ? PayslipStatus.PUBLISHED
                : PayslipStatus.DRAFT;

        List<PayslipResponse> results = new ArrayList<>();

        for (Employee emp : targetEmployees) {
            BigDecimal basic = emp.getSalary() != null ? emp.getSalary() : BigDecimal.ZERO;
            BigDecimal allowances = allowanceRepository.sumActiveAllowances(emp.getId(), calculationDate);
            if (allowances == null) allowances = BigDecimal.ZERO;

            BigDecimal gross = basic.add(allowances);
            BigDecimal tax = gross.multiply(BigDecimal.valueOf(0.10)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal otherDeductions = gross.multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = gross.subtract(tax).subtract(otherDeductions);

            Payslip payslip = payslipRepository.findByEmployeeIdAndMonthAndYear(emp.getId(), request.getMonth(), request.getYear())
                    .orElseGet(() -> Payslip.builder()
                            .employee(emp)
                            .month(request.getMonth())
                            .year(request.getYear())
                            .build());

            payslip.setBasicSalary(basic);
            payslip.setTotalAllowances(allowances);
            payslip.setGrossSalary(gross);
            payslip.setTaxDeduction(tax);
            payslip.setOtherDeductions(otherDeductions);
            payslip.setNetSalary(net);
            payslip.setStatus(initialStatus);
            payslip.setGeneratedBy(adminUsername != null ? adminUsername : "Admin");

            Payslip saved = payslipRepository.save(payslip);
            results.add(mapToResponse(saved));
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayslipResponse> getMyPayslips(String usernameOrEmail) {
        Employee emp = resolveEmployee(usernameOrEmail);
        return payslipRepository.findByEmployeeIdAndStatusOrderByYearDescMonthDesc(emp.getId(), PayslipStatus.PUBLISHED).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PayslipResponse> getEmployeePayslips(Long employeeId) {
        return payslipRepository.findByEmployeeIdOrderByYearDescMonthDesc(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PayslipResponse> filterPayslips(Long employeeId, Integer month, Integer year, PayslipStatus status, Pageable pageable) {
        return payslipRepository.filterPayslips(employeeId, month, year, status, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public PayslipResponse publishPayslip(Long id) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip", "id", id));
        payslip.setStatus(PayslipStatus.PUBLISHED);
        Payslip saved = payslipRepository.save(payslip);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PayslipResponse getPayslipById(Long id) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip", "id", id));
        return mapToResponse(payslip);
    }

    private PayslipResponse mapToResponse(Payslip p) {
        Employee emp = p.getEmployee();
        String empName = emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown";
        String empEmail = emp != null ? emp.getEmail() : "";
        String deptName = (emp != null && emp.getDepartment() != null) ? emp.getDepartment().getName() : "";

        return PayslipResponse.builder()
                .id(p.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(empName)
                .employeeEmail(empEmail)
                .departmentName(deptName)
                .month(p.getMonth())
                .year(p.getYear())
                .basicSalary(p.getBasicSalary())
                .totalAllowances(p.getTotalAllowances())
                .grossSalary(p.getGrossSalary())
                .taxDeduction(p.getTaxDeduction())
                .otherDeductions(p.getOtherDeductions())
                .netSalary(p.getNetSalary())
                .status(p.getStatus())
                .generatedBy(p.getGeneratedBy())
                .generatedAt(p.getGeneratedAt())
                .build();
    }
}
