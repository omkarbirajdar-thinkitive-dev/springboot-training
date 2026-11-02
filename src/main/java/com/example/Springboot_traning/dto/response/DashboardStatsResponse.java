package com.example.Springboot_traning.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalEmployees;
    private long totalDepartments;
    private long pendingLeaves;
    private long presentToday;
    private BigDecimal monthlyPayrollDisbursed;
    private List<Map<String, Object>> departmentHeadcount;
    private List<Map<String, Object>> attendanceTrend;
}
