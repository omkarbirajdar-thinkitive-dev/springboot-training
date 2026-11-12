package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.dto.request.CreateLeaveRequest;
import com.example.Springboot_traning.dto.request.ReviewLeaveRequest;
import com.example.Springboot_traning.dto.response.LeaveResponse;
import com.example.Springboot_traning.entity.LeaveStatus;
import com.example.Springboot_traning.service.LeaveService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
@Tag(name = "Leave Management", description = "Endpoints for applying, approving, and tracking employee leave requests")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
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
    @Operation(summary = "Apply for leave (Employee)")
    public ResponseEntity<LeaveResponse> applyLeave(
            Authentication authentication,
            @Valid @RequestBody CreateLeaveRequest request) {
        String username = extractUsername(authentication);
        LeaveResponse response = leaveService.applyLeave(username, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current employee's leave requests")
    public ResponseEntity<List<LeaveResponse>> getMyLeaves(Authentication authentication) {
        String username = extractUsername(authentication);
        List<LeaveResponse> list = leaveService.getMyLeaves(username);
        return ResponseEntity.ok(list);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Filter leave requests across all employees (Admin only)")
    public ResponseEntity<Page<LeaveResponse>> getAllLeaves(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) LeaveStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<LeaveResponse> page = leaveService.filterLeaves(employeeId, status, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get count of pending leave requests requiring review")
    public ResponseEntity<Map<String, Long>> getPendingCount() {
        long count = leaveService.getPendingLeavesCount();
        return ResponseEntity.ok(Map.of("pendingCount", count));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get leave request by ID")
    public ResponseEntity<LeaveResponse> getLeaveById(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        LeaveResponse response = leaveService.getLeaveById(id, extractUsername(authentication), isAdmin);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve a leave request (Admin only)")
    public ResponseEntity<LeaveResponse> approveLeave(
            @PathVariable Long id,
            Authentication authentication,
            @RequestBody(required = false) ReviewLeaveRequest request) {
        String adminUsername = extractUsername(authentication);
        LeaveResponse response = leaveService.approveLeave(id, adminUsername, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject a leave request (Admin only)")
    public ResponseEntity<LeaveResponse> rejectLeave(
            @PathVariable Long id,
            Authentication authentication,
            @RequestBody(required = false) ReviewLeaveRequest request) {
        String adminUsername = extractUsername(authentication);
        LeaveResponse response = leaveService.rejectLeave(id, adminUsername, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancel a pending leave request (Employee)")
    public ResponseEntity<Void> cancelLeave(
            @PathVariable Long id,
            Authentication authentication) {
        String username = extractUsername(authentication);
        leaveService.cancelLeave(id, username);
        return ResponseEntity.noContent().build();
    }
}
