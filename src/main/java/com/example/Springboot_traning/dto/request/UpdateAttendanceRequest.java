package com.example.Springboot_traning.dto.request;

import com.example.Springboot_traning.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceRequest {

    private LocalDate date;

    private LocalTime checkInTime;

    private LocalTime checkOutTime;

    @NotNull(message = "Status is required")
    private AttendanceStatus status;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}
