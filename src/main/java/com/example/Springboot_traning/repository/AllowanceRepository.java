package com.example.Springboot_traning.repository;

import com.example.Springboot_traning.entity.Allowance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AllowanceRepository extends JpaRepository<Allowance, Long> {

    List<Allowance> findByEmployeeIdOrderByEffectiveFromDesc(Long employeeId);

    @Query("SELECT a FROM Allowance a JOIN FETCH a.employee e LEFT JOIN FETCH e.department WHERE " +
           "(:employeeId IS NULL OR a.employee.id = :employeeId) " +
           "ORDER BY a.effectiveFrom DESC, a.id DESC")
    Page<Allowance> filterAllowances(@Param("employeeId") Long employeeId, Pageable pageable);

    @Query("SELECT a FROM Allowance a WHERE a.employee.id = :employeeId AND " +
           "a.effectiveFrom <= :date AND (a.effectiveTo IS NULL OR a.effectiveTo >= :date)")
    List<Allowance> findActiveAllowances(@Param("employeeId") Long employeeId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM Allowance a WHERE a.employee.id = :employeeId AND " +
           "a.effectiveFrom <= :date AND (a.effectiveTo IS NULL OR a.effectiveTo >= :date)")
    BigDecimal sumActiveAllowances(@Param("employeeId") Long employeeId, @Param("date") LocalDate date);
}
