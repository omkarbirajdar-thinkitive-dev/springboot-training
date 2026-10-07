package com.example.Springboot_traning.service;

import com.example.Springboot_traning.dto.request.CreateEmployeeRequest;
import com.example.Springboot_traning.dto.request.EmployeeProfileRequest;
import com.example.Springboot_traning.dto.request.UpdateEmployeeRequest;
import com.example.Springboot_traning.dto.response.EmployeeProfileResponse;
import com.example.Springboot_traning.dto.response.EmployeeResponse;
import org.springframework.data.domain.Page;

public interface EmployeeService {

    EmployeeResponse createEmployee(CreateEmployeeRequest request);

    EmployeeResponse getEmployeeById(Long id);

    Page<EmployeeResponse> getAllEmployees(String department, int page, int size);

    EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request);

    void deleteEmployee(Long id);

    EmployeeProfileResponse createOrUpdateProfile(Long employeeId, EmployeeProfileRequest request);

    EmployeeProfileResponse getProfile(Long employeeId);
}
