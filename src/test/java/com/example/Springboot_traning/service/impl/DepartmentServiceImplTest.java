package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.dto.request.CreateDepartmentRequest;
import com.example.Springboot_traning.dto.response.DepartmentResponse;
import com.example.Springboot_traning.entity.Department;
import com.example.Springboot_traning.repository.DepartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * CONCEPT: Service Unit Test with Mockito
 * We don't want to hit the real DB. We mock the repository to return controlled data.
 */
@ExtendWith(MockitoExtension.class)
class DepartmentServiceImplTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DepartmentServiceImpl departmentService;

    private Department department;

    @BeforeEach
    void setUp() {
        department = Department.builder()
                .id(1L)
                .name("IT")
                .location("Pune")
                .build();
    }

    @Test
    void createDepartment_ShouldReturnSavedDepartment() {
        // Arrange
        CreateDepartmentRequest request = new CreateDepartmentRequest();
        request.setName("IT");
        request.setLocation("Pune");

        when(departmentRepository.existsByName("IT")).thenReturn(false);
        when(departmentRepository.save(any(Department.class))).thenReturn(department);

        // Act
        DepartmentResponse response = departmentService.createDepartment(request);

        // Assert
        assertNotNull(response);
        assertEquals("IT", response.getName());
        assertEquals("Pune", response.getLocation());
    }
}
