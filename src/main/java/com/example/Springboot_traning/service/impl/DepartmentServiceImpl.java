package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.dto.request.CreateDepartmentRequest;
import com.example.Springboot_traning.dto.request.UpdateDepartmentRequest;
import com.example.Springboot_traning.dto.response.DepartmentResponse;
import com.example.Springboot_traning.entity.Department;
import com.example.Springboot_traning.exception.DuplicateResourceException;
import com.example.Springboot_traning.exception.ResourceNotFoundException;
import com.example.Springboot_traning.repository.DepartmentRepository;
import com.example.Springboot_traning.service.DepartmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Override
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {

        if (departmentRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Department", "name", request.getName());
        }

        Department department = Department.builder()
                .name(request.getName())
                .location(request.getLocation())
                .build();

        Department saved = departmentRepository.save(department);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true) 
    public DepartmentResponse getDepartmentById(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        return toResponse(department);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public DepartmentResponse updateDepartment(Long id, UpdateDepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        if (request.getName() != null && !request.getName().isBlank()) {
            if (!request.getName().equals(department.getName())
                    && departmentRepository.existsByName(request.getName())) {
                throw new DuplicateResourceException("Department", "name", request.getName());
            }
            department.setName(request.getName());
        }
        if (request.getLocation() != null) {
            department.setLocation(request.getLocation());
        }

        return toResponse(departmentRepository.save(department));
    }

    @Override
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        departmentRepository.delete(department);
    }

    private DepartmentResponse toResponse(Department d) {
        return DepartmentResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .location(d.getLocation())
                .employeeCount(d.getEmployees().size())
                .build();
    }
}
