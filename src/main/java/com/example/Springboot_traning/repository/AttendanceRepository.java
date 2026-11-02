package com.example.Springboot_traning.repository;

import com.example.Springboot_traning.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeIdAndDate(Long employeeId, LocalDate date);

    List<Attendance> findByEmployeeIdOrderByDateDesc(Long employeeId);

    List<Attendance> findByEmployeeIdAndDateBetweenOrderByDateDesc(Long employeeId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee e LEFT JOIN FETCH e.department WHERE " +
           "(:employeeId IS NULL OR a.employee.id = :employeeId) AND " +
           "(:startDate IS NULL OR a.date >= :startDate) AND " +
           "(:endDate IS NULL OR a.date <= :endDate) " +
           "ORDER BY a.date DESC, a.id DESC")
    Page<Attendance> filterAttendance(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable
    );

    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee e LEFT JOIN FETCH e.department WHERE a.date = :date")
    List<Attendance> findByDate(@Param("date") LocalDate date);
}
