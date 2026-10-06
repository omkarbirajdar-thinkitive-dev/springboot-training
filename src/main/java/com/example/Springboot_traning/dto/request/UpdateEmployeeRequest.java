package com.example.Springboot_traning.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateEmployeeRequest {

    @Size(min = 2, max = 50)
    private String firstName;

    @Size(min = 2, max = 50)
    private String lastName;

    @Email(message = "Must be a valid email address")
    private String email;

    @Positive(message = "Salary must be a positive number")
    private BigDecimal salary;

    private Long departmentId;
}
