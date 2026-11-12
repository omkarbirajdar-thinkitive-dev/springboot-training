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
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Locale;
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
    public PayslipResponse getPayslipById(Long id, String usernameOrEmail, boolean isAdmin) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payslip", "id", id));

        if (!isAdmin) {
            Employee employee = resolveEmployee(usernameOrEmail);
            if (!payslip.getEmployee().getId().equals(employee.getId())
                    || payslip.getStatus() != PayslipStatus.PUBLISHED) {
                throw new ResourceNotFoundException("Payslip", "id", id);
            }
        }

        return mapToResponse(payslip);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadPayslipPdf(Long id, String usernameOrEmail, boolean isAdmin) {
        PayslipResponse payslip = getPayslipById(id, usernameOrEmail, isAdmin);
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                writePdfLine(content, bold, 18, 54, 740, "Workforce Management - Payslip");
                writePdfLine(content, regular, 11, 54, 710,
                        "Pay period: " + payslip.getMonth() + "/" + payslip.getYear());
                writePdfLine(content, regular, 11, 54, 690, "Employee: " + payslip.getEmployeeName());
                writePdfLine(content, regular, 11, 54, 672, "Department: " + payslip.getDepartmentName());
                writePdfLine(content, regular, 11, 54, 642, "Basic salary: " + formatPdfCurrency(payslip.getBasicSalary()));
                writePdfLine(content, regular, 11, 54, 624, "Allowances: " + formatPdfCurrency(payslip.getTotalAllowances()));
                writePdfLine(content, regular, 11, 54, 606, "Gross salary: " + formatPdfCurrency(payslip.getGrossSalary()));
                writePdfLine(content, regular, 11, 54, 576, "Tax deduction: " + formatPdfCurrency(payslip.getTaxDeduction()));
                writePdfLine(content, regular, 11, 54, 558, "Other deductions: " + formatPdfCurrency(payslip.getOtherDeductions()));
                writePdfLine(content, bold, 13, 54, 524, "Net salary: " + formatPdfCurrency(payslip.getNetSalary()));
                writePdfLine(content, regular, 9, 54, 488,
                        "Status: " + payslip.getStatus() + " | Reference: PAY-" + payslip.getId());
            }

            document.save(output);
            return output.toByteArray();
        } catch (java.io.IOException exception) {
            throw new IllegalStateException("Unable to generate payslip PDF", exception);
        }
    }

    private void writePdfLine(PDPageContentStream content, PDType1Font font, int fontSize,
                              float x, float y, String text) throws java.io.IOException {
        content.beginText();
        content.setFont(font, fontSize);
        content.newLineAtOffset(x, y);
        content.showText(text == null ? "" : text.replaceAll("[^\\x20-\\x7E]", "?"));
        content.endText();
    }

    private String formatPdfCurrency(BigDecimal amount) {
        return String.format(Locale.US, "$%,.2f", amount == null ? BigDecimal.ZERO : amount);
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
