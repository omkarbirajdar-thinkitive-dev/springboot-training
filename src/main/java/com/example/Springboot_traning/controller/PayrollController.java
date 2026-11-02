package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.dto.request.GeneratePayslipRequest;
import com.example.Springboot_traning.dto.response.PayslipResponse;
import com.example.Springboot_traning.entity.PayslipStatus;
import com.example.Springboot_traning.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payslips")
@Tag(name = "Payroll & Billing", description = "Endpoints for generating and viewing employee payroll and payslips")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    private String extractUsername(Authentication authentication) {
        if (authentication == null) return "anonymous";
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) return email;
            String preferred = jwt.getClaimAsString("preferred_username");
            if (preferred != null && !preferred.isBlank()) return preferred;
        }
        return authentication.getName();
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate monthly payslips for employee(s) (Admin only)")
    public ResponseEntity<List<PayslipResponse>> generatePayslips(
            Authentication authentication,
            @Valid @RequestBody GeneratePayslipRequest request) {
        String adminUsername = extractUsername(authentication);
        List<PayslipResponse> list = payrollService.generatePayslips(request, adminUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(list);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List and filter payslips across company (Admin only)")
    public ResponseEntity<Page<PayslipResponse>> getAllPayslips(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) PayslipStatus status,
            @PageableDefault(size = 20, sort = "year", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PayslipResponse> page = payrollService.filterPayslips(employeeId, month, year, status, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current logged-in employee's published payslips")
    public ResponseEntity<List<PayslipResponse>> getMyPayslips(Authentication authentication) {
        String username = extractUsername(authentication);
        List<PayslipResponse> list = payrollService.getMyPayslips(username);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/employee/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get payslips for a specific employee (Admin only)")
    public ResponseEntity<List<PayslipResponse>> getEmployeePayslips(@PathVariable Long id) {
        List<PayslipResponse> list = payrollService.getEmployeePayslips(id);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payslip by ID")
    public ResponseEntity<PayslipResponse> getPayslipById(@PathVariable Long id) {
        PayslipResponse response = payrollService.getPayslipById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Publish a draft payslip (Admin only)")
    public ResponseEntity<PayslipResponse> publishPayslip(@PathVariable Long id) {
        PayslipResponse response = payrollService.publishPayslip(id);
        return ResponseEntity.ok(response);
    }
}
