package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.entity.Employee;
import com.example.Springboot_traning.entity.Payslip;
import com.example.Springboot_traning.entity.PayslipStatus;
import com.example.Springboot_traning.exception.ResourceNotFoundException;
import com.example.Springboot_traning.repository.AllowanceRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import com.example.Springboot_traning.repository.PayslipRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollServiceImplTest {

    @Mock
    private PayslipRepository payslipRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AllowanceRepository allowanceRepository;

    @InjectMocks
    private PayrollServiceImpl payrollService;

    @Test
    void employeeCanReadOwnPublishedPayslip() {
        Employee employee = employee(1L, "employee@example.com");
        Payslip payslip = payslip(employee, PayslipStatus.PUBLISHED);
        when(payslipRepository.findById(10L)).thenReturn(Optional.of(payslip));
        when(employeeRepository.findByEmailIgnoreCase("employee@example.com"))
                .thenReturn(Optional.of(employee));

        var response = payrollService.getPayslipById(10L, "employee@example.com", false);

        assertEquals(10L, response.getId());
    }

    @Test
    void employeeCannotReadAnotherEmployeesPayslip() {
        Employee requester = employee(1L, "employee@example.com");
        Payslip payslip = payslip(employee(2L, "other@example.com"), PayslipStatus.PUBLISHED);
        when(payslipRepository.findById(10L)).thenReturn(Optional.of(payslip));
        when(employeeRepository.findByEmailIgnoreCase("employee@example.com"))
                .thenReturn(Optional.of(requester));

        assertThrows(ResourceNotFoundException.class,
                () -> payrollService.getPayslipById(10L, "employee@example.com", false));
    }

    @Test
    void employeeCannotReadOwnDraftPayslip() {
        Employee employee = employee(1L, "employee@example.com");
        Payslip payslip = payslip(employee, PayslipStatus.DRAFT);
        when(payslipRepository.findById(10L)).thenReturn(Optional.of(payslip));
        when(employeeRepository.findByEmailIgnoreCase("employee@example.com"))
                .thenReturn(Optional.of(employee));

        assertThrows(ResourceNotFoundException.class,
                () -> payrollService.getPayslipById(10L, "employee@example.com", false));
    }

    @Test
    void adminCanReadDraftPayslip() {
        Payslip payslip = payslip(employee(2L, "other@example.com"), PayslipStatus.DRAFT);
        when(payslipRepository.findById(10L)).thenReturn(Optional.of(payslip));

        var response = payrollService.getPayslipById(10L, "admin@example.com", true);

        assertEquals(10L, response.getId());
    }

    @Test
    void authorizedEmployeeCanDownloadPdf() {
        Employee employee = employee(1L, "employee@example.com");
        Payslip payslip = payslip(employee, PayslipStatus.PUBLISHED);
        when(payslipRepository.findById(10L)).thenReturn(Optional.of(payslip));
        when(employeeRepository.findByEmailIgnoreCase("employee@example.com"))
                .thenReturn(Optional.of(employee));

        byte[] pdf = payrollService.downloadPayslipPdf(10L, "employee@example.com", false);

        assertTrue(new String(pdf, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).startsWith("%PDF"));
    }

    private Employee employee(Long id, String email) {
        return Employee.builder().id(id).firstName("Test").lastName("Employee").email(email).build();
    }

    private Payslip payslip(Employee employee, PayslipStatus status) {
        return Payslip.builder().id(10L).employee(employee).month(1).year(2026).status(status).build();
    }
}