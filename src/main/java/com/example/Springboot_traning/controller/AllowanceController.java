package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.dto.request.CreateAllowanceRequest;
import com.example.Springboot_traning.dto.request.UpdateAllowanceRequest;
import com.example.Springboot_traning.dto.response.AllowanceResponse;
import com.example.Springboot_traning.service.AllowanceService;
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
@RequestMapping("/api/allowances")
@Tag(name = "Allowances", description = "Endpoints for employee salary allowances and perks")
public class AllowanceController {

    private final AllowanceService allowanceService;

    public AllowanceController(AllowanceService allowanceService) {
        this.allowanceService = allowanceService;
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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add an allowance to an employee (Admin only)")
    public ResponseEntity<AllowanceResponse> createAllowance(@Valid @RequestBody CreateAllowanceRequest request) {
        AllowanceResponse response = allowanceService.createAllowance(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List allowances across all employees (Admin only)")
    public ResponseEntity<Page<AllowanceResponse>> getAllAllowances(
            @RequestParam(required = false) Long employeeId,
            @PageableDefault(size = 20, sort = "effectiveFrom", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AllowanceResponse> page = allowanceService.filterAllowances(employeeId, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current logged-in employee's allowances")
    public ResponseEntity<List<AllowanceResponse>> getMyAllowances(Authentication authentication) {
        String username = extractUsername(authentication);
        List<AllowanceResponse> list = allowanceService.getMyAllowances(username);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/employee/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all allowances for a specific employee (Admin only)")
    public ResponseEntity<List<AllowanceResponse>> getAllowancesByEmployee(@PathVariable Long id) {
        List<AllowanceResponse> list = allowanceService.getAllowancesByEmployee(id);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get allowance by ID")
    public ResponseEntity<AllowanceResponse> getAllowanceById(@PathVariable Long id) {
        AllowanceResponse response = allowanceService.getAllowanceById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing allowance (Admin only)")
    public ResponseEntity<AllowanceResponse> updateAllowance(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAllowanceRequest request) {
        AllowanceResponse response = allowanceService.updateAllowance(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an allowance (Admin only)")
    public ResponseEntity<Void> deleteAllowance(@PathVariable Long id) {
        allowanceService.deleteAllowance(id);
        return ResponseEntity.noContent().build();
    }
}
