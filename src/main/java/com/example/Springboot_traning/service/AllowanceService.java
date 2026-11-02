package com.example.Springboot_traning.service;

import com.example.Springboot_traning.dto.request.CreateAllowanceRequest;
import com.example.Springboot_traning.dto.request.UpdateAllowanceRequest;
import com.example.Springboot_traning.dto.response.AllowanceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AllowanceService {

    AllowanceResponse createAllowance(CreateAllowanceRequest request);

    AllowanceResponse updateAllowance(Long id, UpdateAllowanceRequest request);

    void deleteAllowance(Long id);

    List<AllowanceResponse> getMyAllowances(String usernameOrEmail);

    List<AllowanceResponse> getAllowancesByEmployee(Long employeeId);

    Page<AllowanceResponse> filterAllowances(Long employeeId, Pageable pageable);

    AllowanceResponse getAllowanceById(Long id);
}
