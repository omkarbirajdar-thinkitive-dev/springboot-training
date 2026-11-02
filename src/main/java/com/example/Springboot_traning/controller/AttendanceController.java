package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.dto.request.CheckInRequest;
import com.example.Springboot_traning.dto.request.CheckOutRequest;
import com.example.Springboot_traning.dto.request.UpdateAttendanceRequest;
import com.example.Springboot_traning.dto.response.AttendanceResponse;
import com.example.Springboot_traning.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@Tag(name = "Attendance", description = "Endpoints for employee attendance tracking and administration")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
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

    @PostMapping("/checkin")
    @Operation(summary = "Mark check-in for today (Employee)")
    public ResponseEntity<AttendanceResponse> checkIn(
            Authentication authentication,
            @RequestBody(required = false) CheckInRequest request) {
        String username = extractUsername(authentication);
        AttendanceResponse response = attendanceService.checkIn(username, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/checkout")
    @Operation(summary = "Mark check-out for today (Employee)")
    public ResponseEntity<AttendanceResponse> checkOut(
            Authentication authentication,
            @RequestBody(required = false) CheckOutRequest request) {
        String username = extractUsername(authentication);
        AttendanceResponse response = attendanceService.checkOut(username, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/today")
    @Operation(summary = "Get current employee's attendance record for today")
    public ResponseEntity<AttendanceResponse> getToday(Authentication authentication) {
        String username = extractUsername(authentication);
        AttendanceResponse response = attendanceService.getTodayAttendance(username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get logged-in employee's attendance history")
    public ResponseEntity<List<AttendanceResponse>> getMyAttendance(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String username = extractUsername(authentication);
        List<AttendanceResponse> history = attendanceService.getMyAttendance(username, startDate, endDate);
        return ResponseEntity.ok(history);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Filter attendance records across all employees (Admin only)")
    public ResponseEntity<Page<AttendanceResponse>> getAllAttendance(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AttendanceResponse> page = attendanceService.filterAttendance(employeeId, startDate, endDate, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/employee/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get attendance history for a specific employee (Admin only)")
    public ResponseEntity<List<AttendanceResponse>> getAttendanceByEmployee(@PathVariable Long id) {
        List<AttendanceResponse> records = attendanceService.getAttendanceByEmployee(id);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get attendance by ID")
    public ResponseEntity<AttendanceResponse> getAttendanceById(@PathVariable Long id) {
        AttendanceResponse record = attendanceService.getAttendanceById(id);
        return ResponseEntity.ok(record);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an attendance record (Admin only)")
    public ResponseEntity<AttendanceResponse> updateAttendance(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAttendanceRequest request) {
        AttendanceResponse updated = attendanceService.updateAttendance(id, request);
        return ResponseEntity.ok(updated);
    }
}
