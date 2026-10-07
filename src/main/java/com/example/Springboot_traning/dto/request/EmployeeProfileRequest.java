package com.example.Springboot_traning.dto.request;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EmployeeProfileRequest {

    @Pattern(regexp = "^[+]?[0-9]{7,15}$", message = "Phone number is invalid")
    private String phone;

    @Size(max = 300, message = "Address must not exceed 300 characters")
    private String address;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;
}
