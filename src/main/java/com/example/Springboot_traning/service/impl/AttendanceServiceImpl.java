package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.dto.request.CheckInRequest;
import com.example.Springboot_traning.dto.request.CheckOutRequest;
import com.example.Springboot_traning.dto.request.UpdateAttendanceRequest;
import com.example.Springboot_traning.dto.response.AttendanceResponse;
import com.example.Springboot_traning.entity.Attendance;
import com.example.Springboot_traning.entity.AttendanceStatus;
import com.example.Springboot_traning.entity.Employee;
import com.example.Springboot_traning.exception.ResourceNotFoundException;
import com.example.Springboot_traning.repository.AttendanceRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import com.example.Springboot_traning.service.AttendanceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public AttendanceServiceImpl(AttendanceRepository attendanceRepository,
                                 EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
    }

    private Employee resolveEmployee(String usernameOrEmail) {
        if (usernameOrEmail == null || usernameOrEmail.isBlank()) {
            throw new ResourceNotFoundException("Employee", "username", "anonymous");
        }
        // 1. Direct match on email
        Optional<Employee> emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail);
        if (emp.isPresent()) return emp.get();

        // 2. Search by identifier
        var matches = employeeRepository.searchByIdentifier(usernameOrEmail);
        if (!matches.isEmpty()) return matches.get(0);

        // 3. Try standard email domains
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@company.com");
        if (emp.isPresent()) return emp.get();
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@springboot.com");
        if (emp.isPresent()) return emp.get();
        emp = employeeRepository.findByEmailIgnoreCase(usernameOrEmail + "@workforce.local");
        if (emp.isPresent()) return emp.get();

        throw new ResourceNotFoundException("Employee", "user", usernameOrEmail);
    }

    @Override
    public AttendanceResponse checkIn(String usernameOrEmail, CheckInRequest request) {
        Employee employee = resolveEmployee(usernameOrEmail);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now().truncatedTo(ChronoUnit.SECONDS);

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), today)
                .orElseGet(() -> Attendance.builder()
                        .employee(employee)
                        .date(today)
                        .status(AttendanceStatus.PRESENT)
                        .build());

        if (attendance.getCheckInTime() == null) {
            attendance.setCheckInTime(now);
        }
        if (request != null && request.getNotes() != null && !request.getNotes().isBlank()) {
            attendance.setNotes(request.getNotes());
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Override
    public AttendanceResponse checkOut(String usernameOrEmail, CheckOutRequest request) {
        Employee employee = resolveEmployee(usernameOrEmail);
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now().truncatedTo(ChronoUnit.SECONDS);

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employee.getId(), today)
                .orElseGet(() -> Attendance.builder()
                        .employee(employee)
                        .date(today)
                        .status(AttendanceStatus.PRESENT)
                        .build());

        attendance.setCheckOutTime(now);
        if (request != null && request.getNotes() != null && !request.getNotes().isBlank()) {
            if (attendance.getNotes() != null && !attendance.getNotes().isBlank()) {
                attendance.setNotes(attendance.getNotes() + " | " + request.getNotes());
            } else {
                attendance.setNotes(request.getNotes());
            }
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceResponse getTodayAttendance(String usernameOrEmail) {
        Employee employee = resolveEmployee(usernameOrEmail);
        LocalDate today = LocalDate.now();
        return attendanceRepository.findByEmployeeIdAndDate(employee.getId(), today)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendance(String usernameOrEmail, LocalDate startDate, LocalDate endDate) {
        Employee employee = resolveEmployee(usernameOrEmail);
        List<Attendance> records;
        if (startDate != null && endDate != null) {
            records = attendanceRepository.findByEmployeeIdAndDateBetweenOrderByDateDesc(employee.getId(), startDate, endDate);
        } else {
            records = attendanceRepository.findByEmployeeIdOrderByDateDesc(employee.getId());
        }
        return records.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AttendanceResponse> filterAttendance(Long employeeId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return attendanceRepository.filterAttendance(employeeId, startDate, endDate, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeIdOrderByDateDesc(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AttendanceResponse updateAttendance(Long id, UpdateAttendanceRequest request) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", "id", id));

        if (request.getDate() != null) {
            attendance.setDate(request.getDate());
        }
        if (request.getCheckInTime() != null) {
            attendance.setCheckInTime(request.getCheckInTime());
        }
        if (request.getCheckOutTime() != null) {
            attendance.setCheckOutTime(request.getCheckOutTime());
        }
        if (request.getStatus() != null) {
            attendance.setStatus(request.getStatus());
        }
        if (request.getNotes() != null) {
            attendance.setNotes(request.getNotes());
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceResponse getAttendanceById(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", "id", id));
        return mapToResponse(attendance);
    }

    private AttendanceResponse mapToResponse(Attendance attendance) {
        Employee emp = attendance.getEmployee();
        String empName = emp != null ? emp.getFirstName() + " " + emp.getLastName() : "Unknown";
        String empEmail = emp != null ? emp.getEmail() : "";
        String deptName = (emp != null && emp.getDepartment() != null) ? emp.getDepartment().getName() : "";

        return AttendanceResponse.builder()
                .id(attendance.getId())
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(empName)
                .employeeEmail(empEmail)
                .departmentName(deptName)
                .date(attendance.getDate())
                .checkInTime(attendance.getCheckInTime())
                .checkOutTime(attendance.getCheckOutTime())
                .status(attendance.getStatus())
                .notes(attendance.getNotes())
                .build();
    }
}
