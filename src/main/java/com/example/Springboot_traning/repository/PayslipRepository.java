package com.example.Springboot_traning.repository;

import com.example.Springboot_traning.entity.Payslip;
import com.example.Springboot_traning.entity.PayslipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, Long> {

    Optional<Payslip> findByEmployeeIdAndMonthAndYear(Long employeeId, Integer month, Integer year);

    List<Payslip> findByEmployeeIdOrderByYearDescMonthDesc(Long employeeId);

    List<Payslip> findByEmployeeIdAndStatusOrderByYearDescMonthDesc(Long employeeId, PayslipStatus status);

    @Query("SELECT p FROM Payslip p JOIN FETCH p.employee e LEFT JOIN FETCH e.department WHERE " +
           "(:employeeId IS NULL OR p.employee.id = :employeeId) AND " +
           "(:month IS NULL OR p.month = :month) AND " +
           "(:year IS NULL OR p.year = :year) AND " +
           "(:status IS NULL OR p.status = :status) " +
           "ORDER BY p.year DESC, p.month DESC, p.id DESC")
    Page<Payslip> filterPayslips(
            @Param("employeeId") Long employeeId,
            @Param("month") Integer month,
            @Param("year") Integer year,
            @Param("status") PayslipStatus status,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payslip p WHERE p.month = :month AND p.year = :year")
    BigDecimal sumNetSalaryByMonthAndYear(@Param("month") Integer month, @Param("year") Integer year);
}
