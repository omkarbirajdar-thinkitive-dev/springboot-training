package com.example.Springboot_traning;

import com.example.Springboot_traning.entity.Department;
import com.example.Springboot_traning.entity.Employee;
import com.example.Springboot_traning.entity.EmployeeProfile;
import com.example.Springboot_traning.repository.DepartmentRepository;
import com.example.Springboot_traning.repository.EmployeeProfileRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeProfileRepository profileRepository;

    public DataLoader(DepartmentRepository departmentRepository,
                      EmployeeRepository employeeRepository,
                      EmployeeProfileRepository profileRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository   = employeeRepository;
        this.profileRepository    = profileRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (departmentRepository.count() > 0) {
            log.info("Database already contains data. Skipping DataLoader.");
            return;
        }

        log.info("═══════════════════════════════════════════");
        log.info("  Seeding sample data into MySQL...");
        log.info("═══════════════════════════════════════════");

        Department engineering = departmentRepository.save(
                Department.builder().name("Engineering").location("Pune, India").build());
        Department hr = departmentRepository.save(
                Department.builder().name("Human Resources").location("Mumbai, India").build());
        Department marketing = departmentRepository.save(
                Department.builder().name("Marketing").location("Bangalore, India").build());

        log.info("Seeded {} departments", departmentRepository.count());

        Employee alice = employeeRepository.save(Employee.builder()
                .firstName("Alice").lastName("Kumar")
                .email("alice.kumar@company.com")
                .salary(new BigDecimal("85000.00"))
                .department(engineering).build());

        Employee bob = employeeRepository.save(Employee.builder()
                .firstName("Bob").lastName("Sharma")
                .email("bob.sharma@company.com")
                .salary(new BigDecimal("72000.00"))
                .department(engineering).build());

        Employee carol = employeeRepository.save(Employee.builder()
                .firstName("Carol").lastName("Patel")
                .email("carol.patel@company.com")
                .salary(new BigDecimal("65000.00"))
                .department(hr).build());

        Employee dave = employeeRepository.save(Employee.builder()
                .firstName("Dave").lastName("Singh")
                .email("dave.singh@company.com")
                .salary(new BigDecimal("78000.00"))
                .department(marketing).build());

        log.info("Seeded {} employees", employeeRepository.count());

        profileRepository.save(EmployeeProfile.builder()
                .phone("+91-9876543210")
                .address("123 Tech Park, Pune 411001")
                .dateOfBirth(LocalDate.of(1993, 5, 15))
                .employee(alice).build());

        profileRepository.save(EmployeeProfile.builder()
                .phone("+91-9123456789")
                .address("456 Software Colony, Pune 411006")
                .dateOfBirth(LocalDate.of(1990, 11, 28))
                .employee(bob).build());

        log.info("Seeded {} employee profiles", profileRepository.count());
        log.info("═══════════════════════════════════════════");
        log.info("  Data seeding complete!");
        log.info("  → Swagger UI:    http://localhost:8080/swagger-ui/index.html");
        log.info("═══════════════════════════════════════════");
    }
}
