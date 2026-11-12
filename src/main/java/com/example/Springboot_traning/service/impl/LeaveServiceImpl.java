package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.dto.request.CreateLeaveRequest;
import com.example.Springboot_traning.dto.request.ReviewLeaveRequest;
import com.example.Springboot_traning.dto.response.LeaveResponse;
import com.example.Springboot_traning.entity.*;
import com.example.Springboot_traning.exception.ResourceNotFoundException;
import com.example.Springboot_traning.repository.AttendanceRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import com.example.Springboot_traning.repository.LeaveRequestRepository;
import com.example.Springboot_traning.service.LeaveService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;

    public LeaveServiceImpl(LeaveRequestRepository leaveRequestRepository,
                            EmployeeRepository employeeRepository,
                            AttendanceRepository attendanceRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
    }

    private Employee resolveEmployee(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new ResourceNotFoundException("Employee", "username", "anonymous");
        }
        Optional<Employee> emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail);
        if (emp.isPresent()) return emp.get();

        var matches = employeeRepository.searchByIdentifier(usernameOrEmail);
        if (!matches.isEmpty()) return matches.get(0);

        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@company.com");
        if (emp.isPresent()) return emp.get();
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@springboot.com");
        if (emp.isPresent()) return emp.get();
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@workforce.local");
        if (emp.isPresent()) return emp.get();

        throw new ResourceNotFoundException("Employee", "user", usernameOrEmail);
    }

    @Override
    public LeaveResponse applyLeave(String usernameOrEmail, CreateLeaveRequest request) {
        Employee employee = resolveEmployee(usernameOrEmail);

        if (request.getToDate().isBefore(request.getFromDate())) {
            throw new IllegalArgumentException("To date cannot be before From date");
        }

        int totalDays = (int) ChronoUnit.DAYS.between(request.getFromDate(), request.getToDate()) + 1;

        LeaveRequest leave = LeaveRequest.builder()
                .employee(employee)
                .leaveType(request.getLeaveType())
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .totalDays(totalDays)
                .reason(request.getReason())
                .status(LeaveStatus.PENDING)
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leave);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveResponse> getMyLeaves(String usernameOrEmail) {
        Employee employee = resolveEmployee(usernameOrEmail);
        return leaveRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employee.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaveResponse> filterLeaves(Long employeeId, LeaveStatus status, Pageable pageable) {
        return leaveRequestRepository.filterLeaves(employeeId, status, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public LeaveResponse approveLeave(Long id, String adminUsername, ReviewLeaveRequest request) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", id));

        leave.setStatus(LeaveStatus.APPROVED);
        leave.setReviewedBy(adminUsername != null ? adminUsername : "Admin");
        leave.setReviewedAt(LocalDateTime.now());
        if (request != null && request.getAdminComment() != null) {
            leave.setAdminComment(request.getAdminComment());
        }

        LeaveRequest saved = leaveRequestRepository.save(leave);

        // Optionally record in attendance as ON_LEAVE
        LocalDate curr = saved.getFromDate();
        while (!curr.isAfter(saved.getToDate())) {
            final LocalDate date = curr;
            Attendance att = attendanceRepository.findByEmployeeIdAndDate(saved.getEmployee().getId(), date)
                    .orElseGet(() -> Attendance.builder()
                            .employee(saved.getEmployee())
                            .date(date)
                            .build());
            att.setStatus(AttendanceStatus.ON_LEAVE);
            att.setNotes("Leave approved (" + saved.getLeaveType() + ")");
            attendanceRepository.save(att);
            curr = curr.plusDays(1);
        }

        return mapToResponse(saved);
    }

    @Override
    public LeaveResponse rejectLeave(Long id, String adminUsername, ReviewLeaveRequest request) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", id));

        leave.setStatus(LeaveStatus.REJECTED);
        leave.setReviewedBy(adminUsername != null ? adminUsername : "Admin");
        leave.setReviewedAt(LocalDateTime.now());
        if (request != null && request.getAdminComment() != null) {
            leave.setAdminComment(request.getAdminComment());
        }

        LeaveRequest saved = leaveRequestRepository.save(leave);
        return mapToResponse(saved);
    }

    @Override
    public void cancelLeave(Long id, String usernameOrEmail) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", id));

        Employee currentEmployee = resolveEmployee(usernameOrEmail);
        if (!leave.getEmployee().getId().equals(currentEmployee.getId())) {
            throw new IllegalArgumentException("You can only cancel your own leave requests");
        }

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only PENDING leave requests can be cancelled");
        }

        leave.setStatus(LeaveStatus.CANCELLED);
        leaveRequestRepository.save(leave);
    }

    @Override
    @Transactional(readOnly = true)
    public LeaveResponse getLeaveById(Long id, String usernameOrEmail, boolean isAdmin) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", id));

        if (!isAdmin) {
            Employee employee = resolveEmployee(usernameOrEmail);
            if (!leave.getEmployee().getId().equals(employee.getId())) {
                throw new ResourceNotFoundException("LeaveRequest", "id", id);
            }
        }

        return mapToResponse(leave);
    }

    @Override
    @Transactional(readOnly = true)
    public long getPendingLeavesCount() {
        return leaveRequestRepository.countByStatus(LeaveStatus.PENDING);
    }

    private LeaveResponse mapToResponse(LeaveRequest leave) {
        Employee emp = leave.getEmployee();
        String empName = emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown";
        String empEmail = emp != null ? emp.getEmail() : "";
        String deptName = (emp != null && emp.getDepartment() != null) ? emp.getDepartment().getName() : "";

        return LeaveResponse.builder()
                .id(leave.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(empName)
                .employeeEmail(empEmail)
                .departmentName(deptName)
                .leaveType(leave.getLeaveType())
                .fromDate(leave.getFromDate())
                .toDate(leave.getToDate())
                .totalDays(leave.getTotalDays())
                .reason(leave.getReason())
                .status(leave.getStatus())
                .reviewedBy(leave.getReviewedBy())
                .reviewedAt(leave.getReviewedAt())
                .adminComment(leave.getAdminComment())
                .createdAt(leave.getCreatedAt())
                .build();
    }
}
