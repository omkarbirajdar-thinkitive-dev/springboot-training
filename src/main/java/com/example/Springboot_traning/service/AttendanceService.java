package com.example.Springboot_traning.service;

import com.example.Springboot_traning.dto.request.CheckInRequest;
import com.example.Springboot_traning.dto.request.CheckOutRequest;
import com.example.Springboot_traning.dto.request.UpdateAttendanceRequest;
import com.example.Springboot_traning.dto.response.AttendanceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {

    AttendanceResponse checkIn(String usernameOrEmail, CheckInRequest request);

    AttendanceResponse checkOut(String usernameOrEmail, CheckOutRequest request);

    AttendanceResponse getTodayAttendance(String usernameOrEmail);

    List<AttendanceResponse> getMyAttendance(String usernameOrEmail, LocalDate startDate, LocalDate endDate);

    Page<AttendanceResponse> filterAttendance(Long employeeId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<AttendanceResponse> getAttendanceByEmployee(Long employeeId);

    AttendanceResponse updateAttendance(Long id, UpdateAttendanceRequest request);

    AttendanceResponse getAttendanceById(Long id);
}
