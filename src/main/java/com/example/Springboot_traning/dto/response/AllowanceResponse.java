package com.example.Springboot_traning.dto.response;

import com.example.Springboot_traning.entity.AllowanceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllowanceResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    private String departmentName;
    private AllowanceType type;
    private BigDecimal amount;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String description;
    private LocalDateTime createdAt;
}
