package com.example.Springboot_traning.service;

import com.example.Springboot_traning.dto.request.GeneratePayslipRequest;
import com.example.Springboot_traning.dto.response.PayslipResponse;
import com.example.Springboot_traning.entity.PayslipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PayrollService {

    List<PayslipResponse> generatePayslips(GeneratePayslipRequest request, String adminUsername);

    List<PayslipResponse> getMyPayslips(String usernameOrEmail);

    List<PayslipResponse> getEmployeePayslips(Long employeeId);

    Page<PayslipResponse> filterPayslips(Long employeeId, Integer month, Integer year, PayslipStatus status, Pageable pageable);

    PayslipResponse publishPayslip(Long id);

    PayslipResponse getPayslipById(Long id, String usernameOrEmail, boolean isAdmin);

    byte[] downloadPayslipPdf(Long id, String usernameOrEmail, boolean isAdmin);
}
