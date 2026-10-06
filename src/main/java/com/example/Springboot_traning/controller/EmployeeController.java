package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.dto.request.CreateEmployeeRequest;
import com.example.Springboot_traning.dto.request.EmployeeProfileRequest;
import com.example.Springboot_traning.dto.request.UpdateEmployeeRequest;
import com.example.Springboot_traning.dto.response.EmployeeProfileResponse;
import com.example.Springboot_traning.dto.response.EmployeeResponse;
import com.example.Springboot_traning.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employee Management", description = "CRUD operations for Employees and their Profiles")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    @Operation(summary = "Create a new employee")
    public ResponseEntity<EmployeeResponse> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.createEmployee(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID")
    public ResponseEntity<EmployeeResponse> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @GetMapping
    @Operation(summary = "Get all employees with optional department filter and pagination")
    public ResponseEntity<Page<EmployeeResponse>> getAllEmployees(
            @RequestParam(required = false)
            @Parameter(description = "Filter by department name (optional)") String department,

            @RequestParam(defaultValue = "0")
            @Parameter(description = "Zero-based page index (default: 0)") int page,

            @RequestParam(defaultValue = "10")
            @Parameter(description = "Number of records per page (default: 10)") int size) {

        return ResponseEntity.ok(employeeService.getAllEmployees(department, page, size));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an employee (partial update supported)")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an employee (also deletes their profile)")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build(); 
    }

    @PostMapping("/{employeeId}/profile")
    @Operation(summary = "Create or update employee profile")
    public ResponseEntity<EmployeeProfileResponse> createOrUpdateProfile(
            @PathVariable Long employeeId,
            @Valid @RequestBody EmployeeProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.createOrUpdateProfile(employeeId, request));
    }

    @GetMapping("/{employeeId}/profile")
    @Operation(summary = "Get employee profile")
    public ResponseEntity<EmployeeProfileResponse> getProfile(@PathVariable Long employeeId) {
        return ResponseEntity.ok(employeeService.getProfile(employeeId));
    }
}
