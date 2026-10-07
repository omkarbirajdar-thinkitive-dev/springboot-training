package com.example.Springboot_traning.repository;

import com.example.Springboot_traning.entity.EmployeeProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeProfileRepository extends JpaRepository<EmployeeProfile, Long> {

    Optional<EmployeeProfile> findByEmployee_Id(Long employeeId);

    boolean existsByEmployee_Id(Long employeeId);
}
