package com.example.Springboot_traning.controller;

import com.example.Springboot_traning.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Endpoints for generating downloadable workforce CSV reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping(value = "/attendance", produces = "text/csv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Download attendance CSV report for a given month and year (Admin only)")
    public ResponseEntity<String> getAttendanceReport(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        String csv = reportService.generateAttendanceReportCsv(month, year);
        String filename = String.format("attendance-report-%d-%d.csv", year != null ? year : 2026, month != null ? month : 1);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping(value = "/payroll", produces = "text/csv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Download payroll CSV report for a given month and year (Admin only)")
    public ResponseEntity<String> getPayrollReport(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        String csv = reportService.generatePayrollReportCsv(month, year);
        String filename = String.format("payroll-report-%d-%d.csv", year != null ? year : 2026, month != null ? month : 1);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping(value = "/leaves", produces = "text/csv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Download leave requests CSV report for a given year (Admin only)")
    public ResponseEntity<String> getLeaveReport(@RequestParam(required = false) Integer year) {
        String csv = reportService.generateLeaveReportCsv(year);
        String filename = String.format("leaves-report-%d.csv", year != null ? year : 2026);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
