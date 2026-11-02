package com.example.Springboot_traning.dto.response;

import com.example.Springboot_traning.entity.LeaveStatus;
import com.example.Springboot_traning.entity.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    private String departmentName;
    private LeaveType leaveType;
    private LocalDate fromDate;
    private LocalDate toDate;
    private Integer totalDays;
    private String reason;
    private LeaveStatus status;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private String adminComment;
    private LocalDateTime createdAt;
}
