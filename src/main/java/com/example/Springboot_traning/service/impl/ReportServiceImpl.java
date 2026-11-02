package com.example.Springboot_traning.service.impl;

import com.example.Springboot_traning.dto.response.DashboardStatsResponse;
import com.example.Springboot_traning.entity.Attendance;
import com.example.Springboot_traning.entity.AttendanceStatus;
import com.example.Springboot_traning.entity.Department;
import com.example.Springboot_traning.entity.LeaveRequest;
import com.example.Springboot_traning.entity.LeaveStatus;
import com.example.Springboot_traning.entity.Payslip;
import com.example.Springboot_traning.repository.AttendanceRepository;
import com.example.Springboot_traning.repository.DepartmentRepository;
import com.example.Springboot_traning.repository.EmployeeRepository;
import com.example.Springboot_traning.repository.LeaveRequestRepository;
import com.example.Springboot_traning.repository.PayslipRepository;
import com.example.Springboot_traning.service.ReportService;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AttendanceRepository attendanceRepository;
    private final PayslipRepository payslipRepository;

    public ReportServiceImpl(EmployeeRepository employeeRepository,
                             DepartmentRepository departmentRepository,
                             LeaveRequestRepository leaveRequestRepository,
                             AttendanceRepository attendanceRepository,
                             PayslipRepository payslipRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.attendanceRepository = attendanceRepository;
        this.payslipRepository = payslipRepository;
    }

    @Override
    public DashboardStatsResponse getDashboardStats() {
        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();

        long totalEmployees = employeeRepository.count();
        long totalDepartments = departmentRepository.count();
        long pendingLeaves = leaveRequestRepository.countByStatus(LeaveStatus.PENDING);

        List<Attendance> todayRecords = attendanceRepository.findByDate(today);
        long presentToday = todayRecords.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.HALF_DAY)
                .count();

        BigDecimal payrollDisbursed = payslipRepository.sumNetSalaryByMonthAndYear(currentMonth, currentYear);
        if (payrollDisbursed == null) payrollDisbursed = BigDecimal.ZERO;

        List<Department> departments = departmentRepository.findAll();
        List<Map<String, Object>> departmentHeadcount = new ArrayList<>();
        for (Department d : departments) {
            Map<String, Object> item = new HashMap<>();
            item.put("department", d.getName());
            item.put("count", d.getEmployees() != null ? d.getEmployees().size() : 0);
            departmentHeadcount.add(item);
        }

        List<Map<String, Object>> attendanceTrend = new ArrayList<>();
        DateTimeFormatter trendFmt = DateTimeFormatter.ofPattern("MMM dd");
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            List<Attendance> dayRecords = attendanceRepository.findByDate(d);
            long count = dayRecords.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.HALF_DAY)
                    .count();
            Map<String, Object> dayMap = new HashMap<>();
            dayMap.put("date", d.format(trendFmt));
            dayMap.put("present", count);
            attendanceTrend.add(dayMap);
        }

        return DashboardStatsResponse.builder()
                .totalEmployees(totalEmployees)
                .totalDepartments(totalDepartments)
                .pendingLeaves(pendingLeaves)
                .presentToday(presentToday)
                .monthlyPayrollDisbursed(payrollDisbursed)
                .departmentHeadcount(departmentHeadcount)
                .attendanceTrend(attendanceTrend)
                .build();
    }

    @Override
    public String generateAttendanceReportCsv(Integer month, Integer year) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();

        LocalDate startDate = LocalDate.of(y, m, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        var page = attendanceRepository.filterAttendance(null, startDate, endDate, Pageable.unpaged());
        List<Attendance> list = page.getContent();

        StringBuilder sb = new StringBuilder();
        sb.append("ID,Employee Name,Email,Department,Date,Status,Check-In,Check-Out,Notes\n");
        for (Attendance a : list) {
            String empName = a.getEmployee() != null ? a.getEmployee().getFirstName() + " " + a.getEmployee().getLastName() : "Unknown";
            String email = a.getEmployee() != null ? a.getEmployee().getEmail() : "";
            String dept = (a.getEmployee() != null && a.getEmployee().getDepartment() != null) ? a.getEmployee().getDepartment().getName() : "";

            sb.append(a.getId()).append(",")
              .append("\"").append(empName.replace("\"", "\"\"")).append("\",")
              .append("\"").append(email).append("\",")
              .append("\"").append(dept).append("\",")
              .append(a.getDate()).append(",")
              .append(a.getStatus()).append(",")
              .append(a.getCheckInTime() != null ? a.getCheckInTime() : "").append(",")
              .append(a.getCheckOutTime() != null ? a.getCheckOutTime() : "").append(",")
              .append("\"").append(a.getNotes() != null ? a.getNotes().replace("\"", "\"\"") : "").append("\"\n");
        }
        return sb.toString();
    }

    @Override
    public String generatePayrollReportCsv(Integer month, Integer year) {
        LocalDate now = LocalDate.now();
        int m = month != null ? month : now.getMonthValue();
        int y = year != null ? year : now.getYear();

        var page = payslipRepository.filterPayslips(null, m, y, null, Pageable.unpaged());
        List<Payslip> list = page.getContent();

        StringBuilder sb = new StringBuilder();
        sb.append("ID,Employee Name,Email,Department,Month,Year,Basic Salary,Total Allowances,Gross Salary,Tax Deduction,Other Deductions,Net Salary,Status\n");
        for (Payslip p : list) {
            String empName = p.getEmployee() != null ? p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName() : "Unknown";
            String email = p.getEmployee() != null ? p.getEmployee().getEmail() : "";
            String dept = (p.getEmployee() != null && p.getEmployee().getDepartment() != null) ? p.getEmployee().getDepartment().getName() : "";

            sb.append(p.getId()).append(",")
              .append("\"").append(empName.replace("\"", "\"\"")).append("\",")
              .append("\"").append(email).append("\",")
              .append("\"").append(dept).append("\",")
              .append(p.getMonth()).append(",")
              .append(p.getYear()).append(",")
              .append(p.getBasicSalary()).append(",")
              .append(p.getTotalAllowances()).append(",")
              .append(p.getGrossSalary()).append(",")
              .append(p.getTaxDeduction()).append(",")
              .append(p.getOtherDeductions()).append(",")
              .append(p.getNetSalary()).append(",")
              .append(p.getStatus()).append("\n");
        }
        return sb.toString();
    }

    @Override
    public String generateLeaveReportCsv(Integer year) {
        int y = year != null ? year : LocalDate.now().getYear();

        var page = leaveRequestRepository.filterLeaves(null, null, Pageable.unpaged());
        List<LeaveRequest> list = page.getContent().stream()
                .filter(l -> l.getFromDate().getYear() == y)
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("ID,Employee Name,Department,Leave Type,From Date,To Date,Total Days,Status,Reason,Reviewed By,Admin Comment\n");
        for (LeaveRequest l : list) {
            String empName = l.getEmployee() != null ? l.getEmployee().getFirstName() + " " + l.getEmployee().getLastName() : "Unknown";
            String dept = (l.getEmployee() != null && l.getEmployee().getDepartment() != null) ? l.getEmployee().getDepartment().getName() : "";

            sb.append(l.getId()).append(",")
              .append("\"").append(empName.replace("\"", "\"\"")).append("\",")
              .append("\"").append(dept).append("\",")
              .append(l.getLeaveType()).append(",")
              .append(l.getFromDate()).append(",")
              .append(l.getToDate()).append(",")
              .append(l.getTotalDays()).append(",")
              .append(l.getStatus()).append(",")
              .append("\"").append(l.getReason().replace("\"", "\"\"")).append("\",")
              .append("\"").append(l.getReviewedBy() != null ? l.getReviewedBy() : "").append("\",")
              .append("\"").append(l.getAdminComment() != null ? l.getAdminComment().replace("\"", "\"\"") : "").append("\"\n");
        }
        return sb.toString();
    }
}
