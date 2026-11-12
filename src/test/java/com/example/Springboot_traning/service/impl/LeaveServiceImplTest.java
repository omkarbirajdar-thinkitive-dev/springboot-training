package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.entity.Employee;
import com.example.Springboot_traning.entity.LeaveRequest;
import com.example.Springboot_traning.entity.LeaveStatus;
import com.example.Springboot_traning.entity.LeaveType;
import com.example.Springboot_traning.exception.ResourceNotFoundException;
import com.example.Springboot_traning.repository.AttendanceRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import com.example.Springboot_traning.repository.LeaveRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaveServiceImplTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @InjectMocks
    private LeaveServiceImpl leaveService;

    @Test
    void employeeCanReadOwnLeaveRequest() {
        Employee employee = employee(1L, "employee@example.com");
        LeaveRequest leave = leaveRequest(employee);
        when(leaveRequestRepository.findById(20L)).thenReturn(Optional.of(leave));
        when(employeeRepository.findByEmailIgnoreCase("employee@example.com"))
                .thenReturn(Optional.of(employee));

        var response = leaveService.getLeaveById(20L, "employee@example.com", false);

        assertEquals(20L, response.getId());
    }

    @Test
    void employeeCannotReadAnotherEmployeesLeaveRequest() {
        Employee requester = employee(1L, "employee@example.com");
        LeaveRequest leave = leaveRequest(employee(2L, "other@example.com"));
        when(leaveRequestRepository.findById(20L)).thenReturn(Optional.of(leave));
        when(employeeRepository.findByEmailIgnoreCase("employee@example.com"))
                .thenReturn(Optional.of(requester));

        assertThrows(ResourceNotFoundException.class,
                () -> leaveService.getLeaveById(20L, "employee@example.com", false));
    }

    @Test
    void adminCanReadAnyLeaveRequest() {
        LeaveRequest leave = leaveRequest(employee(2L, "other@example.com"));
        when(leaveRequestRepository.findById(20L)).thenReturn(Optional.of(leave));

        var response = leaveService.getLeaveById(20L, "admin@example.com", true);

        assertEquals(20L, response.getId());
    }

    private Employee employee(Long id, String email) {
        return Employee.builder().id(id).firstName("Test").lastName("Employee").email(email).build();
    }

    private LeaveRequest leaveRequest(Employee employee) {
        return LeaveRequest.builder()
                .id(20L)
                .employee(employee)
                .leaveType(LeaveType.CASUAL)
                .fromDate(LocalDate.of(2026, 11, 12))
                .toDate(LocalDate.of(2026, 11, 12))
                .totalDays(1)
                .reason("Personal")
                .status(LeaveStatus.PENDING)
                .build();
    }
}