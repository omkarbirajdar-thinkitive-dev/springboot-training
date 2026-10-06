package com.example.Springboot_traning.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDepartmentRequest {

    @Size(min = 2, max = 100, message = "Department name must be 2–100 characters")
    private String name;

    @Size(max = 200)
    private String location;
}
