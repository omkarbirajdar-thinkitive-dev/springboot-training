package com.example.Springboot_traning.repository;

import com.example.Springboot_traning.entity.LeaveRequest;
import com.example.Springboot_traning.entity.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    long countByStatus(LeaveStatus status);

    @Query("SELECT l FROM LeaveRequest l JOIN FETCH l.employee e LEFT JOIN FETCH e.department WHERE " +
           "(:employeeId IS NULL OR l.employee.id = :employeeId) AND " +
           "(:status IS NULL OR l.status = :status) " +
           "ORDER BY l.createdAt DESC")
    Page<LeaveRequest> filterLeaves(
            @Param("employeeId") Long employeeId,
            @Param("status") LeaveStatus status,
            Pageable pageable
    );
}
