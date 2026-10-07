package com.example.Springboot_traning.service;

import com.example.Springboot_traning.dto.request.CreateDepartmentRequest;
import com.example.Springboot_traning.dto.request.UpdateDepartmentRequest;
import com.example.Springboot_traning.dto.response.DepartmentResponse;

import java.util.List;

public interface DepartmentService {

    DepartmentResponse createDepartment(CreateDepartmentRequest request);

    DepartmentResponse getDepartmentById(Long id);

    List<DepartmentResponse> getAllDepartments();

    DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request);

    void deleteDepartment(Long id);
}
