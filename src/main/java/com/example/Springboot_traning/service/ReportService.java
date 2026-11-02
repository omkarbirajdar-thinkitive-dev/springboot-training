package com.example.Springboot_traning.service;

import com.example.Springboot_traning.dto.response.DashboardStatsResponse;

public interface ReportService {

    DashboardStatsResponse getDashboardStats();

    String generateAttendanceReportCsv(Integer month, Integer year);

    String generatePayrollReportCsv(Integer month, Integer year);

    String generateLeaveReportCsv(Integer year);
}
