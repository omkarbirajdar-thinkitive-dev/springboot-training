package com.example.Springboot_traning.service;

import com.example.Springboot_traning.dto.request.CreateLeaveRequest;
import com.example.Springboot_traning.dto.request.ReviewLeaveRequest;
import com.example.Springboot_traning.dto.response.LeaveResponse;
import com.example.Springboot_traning.entity.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface LeaveService {

    LeaveResponse applyLeave(String usernameOrEmail, CreateLeaveRequest request);

    List<LeaveResponse> getMyLeaves(String usernameOrEmail);

    Page<LeaveResponse> filterLeaves(Long employeeId, LeaveStatus status, Pageable pageable);

    LeaveResponse approveLeave(Long id, String adminUsername, ReviewLeaveRequest request);

    LeaveResponse rejectLeave(Long id, String adminUsername, ReviewLeaveRequest request);

    void cancelLeave(Long id, String usernameOrEmail);

    LeaveResponse getLeaveById(Long id, String usernameOrEmail, boolean isAdmin);

    long getPendingLeavesCount();
}
