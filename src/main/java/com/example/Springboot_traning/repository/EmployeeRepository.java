package com.example.Springboot_traning.repository;

import com.example.Springboot_traning.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Page<Employee> findByDepartment_Name(String departmentName, Pageable pageable);

    @Query("SELECT e FROM Employee e WHERE (:department IS NULL OR e.department.name = :department)")
    Page<Employee> findByOptionalDepartment(@Param("department") String department, Pageable pageable);

    boolean existsByEmail(String email);
}
