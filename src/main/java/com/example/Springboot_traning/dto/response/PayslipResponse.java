package com.example.Springboot_traning.dto.response;

import com.example.Springboot_traning.entity.PayslipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayslipResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    private String departmentName;
    private Integer month;
    private Integer year;
    private BigDecimal basicSalary;
    private BigDecimal totalAllowances;
    private BigDecimal grossSalary;
    private BigDecimal taxDeduction;
    private BigDecimal otherDeductions;
    private BigDecimal netSalary;
    private PayslipStatus status;
    private String generatedBy;
    private LocalDateTime generatedAt;
}
