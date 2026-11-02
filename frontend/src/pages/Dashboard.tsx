import { Box, Grid, Paper, Typography } from '@mui/material'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import BeachAccessOutlined from '@mui/icons-material/BeachAccessOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded'
import PaymentsRounded from '@mui/icons-material/PaymentsRounded'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

import { useSession } from '../context/SessionContext'
import { PageHeader, StatCard } from '../components/Layout'
import { reportsApi } from '../api/reports'
import { attendanceApi } from '../api/attendance'
import { leavesApi } from '../api/leaves'
import { payrollApi } from '../api/payroll'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function Dashboard() {
  const { session, isAdmin } = useSession()
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Admin Dashboard stats
  const adminStatsQuery = useQuery({
    queryKey: ['dashboard', 'adminStats'],
    queryFn: () => reportsApi.getStats(),
    enabled: isAdmin,
  })

  // Employee specific queries
  const employeeAttendanceQuery = useQuery({
    queryKey: ['attendance', 'me'],
    queryFn: () => attendanceApi.getMyHistory(),
    enabled: !isAdmin,
  })

  const employeeLeavesQuery = useQuery({
    queryKey: ['leaves', 'me'],
    queryFn: () => leavesApi.getMyLeaves(),
    enabled: !isAdmin,
  })

  const employeePayslipsQuery = useQuery({
    queryKey: ['payslips', 'me'],
    queryFn: () => payrollApi.getMyPayslips(),
    enabled: !isAdmin,
  })

  const stats = adminStatsQuery.data
  const myAttendance = employeeAttendanceQuery.data ?? []
  const myLeaves = employeeLeavesQuery.data ?? []
  const myPayslips = employeePayslipsQuery.data ?? []

  const myPresentDays = myAttendance.filter((a) => a.status === 'PRESENT').length
  const myApprovedLeaves = myLeaves.filter((l) => l.status === 'APPROVED').length
  const myLatestSlip = myPayslips[0]

  return (
    <Box>
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting}, ${session?.username ?? ''}!`}
        subtitle={
          isAdmin
            ? "Here's an overview of your organization's workforce and activities."
            : "Welcome to your workforce portal. Here is your personal overview."
        }
      />

      {isAdmin ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Top Metric Cards */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                label="Total Employees"
                value={stats?.totalEmployees ?? '—'}
                icon={<BadgeOutlined />}
                color="#176b5b"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                label="Present Today"
                value={stats?.presentToday ?? '—'}
                icon={<CalendarMonthOutlined />}
                color="#0e704a"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                label="Pending Leave Approvals"
                value={stats?.pendingLeaves ?? '—'}
                icon={<BeachAccessOutlined />}
                color="#b46d00"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                label="Monthly Payroll Net"
                value={stats?.monthlyPayrollDisbursed ? formatCurrency(stats.monthlyPayrollDisbursed) : '—'}
                icon={<PaymentsRounded />}
                color="#1565c0"
              />
            </Grid>
          </Grid>

          {/* Visual Analytics Charts */}
          <Grid container spacing={3}>
            {/* 7-day Attendance Trend Chart */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid #dfe6e2',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#173c35' }}>
                    Weekly Attendance Trend
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Number of verified present employees over the last 7 days
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 260, mt: 'auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats?.attendanceTrend ?? []}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="attGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#176b5b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#176b5b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2ee" />
                      <XAxis dataKey="date" tick={{ fill: '#667873', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#667873', fontSize: 12 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="present"
                        name="Present Staff"
                        stroke="#176b5b"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#attGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Department Headcount Bar Chart */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid #dfe6e2',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#173c35' }}>
                    Department Distribution
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Headcount allocation across corporate divisions
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 260, mt: 'auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats?.departmentHeadcount ?? []}
                      margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2ee" />
                      <XAxis dataKey="department" tick={{ fill: '#667873', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#667873', fontSize: 12 }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        name="Employees"
                        fill="#c75a3a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Days Present"
              value={`${myPresentDays} Days`}
              icon={<CalendarMonthOutlined />}
              color="#176b5b"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Approved Leaves"
              value={myApprovedLeaves}
              icon={<BeachAccessOutlined />}
              color="#1565c0"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              label="Latest Net Payslip"
              value={myLatestSlip ? formatCurrency(myLatestSlip.netSalary) : '—'}
              icon={<ReceiptLongOutlined />}
              color="#0e704a"
            />
          </Grid>

          {/* Quick links */}
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Box sx={{ p: 3, border: '1px solid #dfe8e1', borderRadius: 2, bgcolor: '#fff' }}>
              <Box sx={{ fontWeight: 700, color: '#173c35', mb: 2 }}>Quick Actions</Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {[
                  { label: "Mark Today's Attendance", to: '/attendance' },
                  { label: 'Apply for Leave', to: '/leaves' },
                  { label: 'View My Payslips', to: '/payslips' },
                  { label: 'Review Benefits & Allowances', to: '/allowances' },
                  { label: 'Edit My Profile Details', to: '/profile' },
                  { label: 'Change Account Password', to: '/password' },
                ].map(({ label, to }) => (
                  <Box
                    key={to}
                    component={Link}
                    to={to}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 2,
                      py: 1,
                      borderRadius: '6px',
                      border: '1px solid #dfe8e1',
                      color: '#176b5b',
                      fontSize: 13,
                      fontWeight: 650,
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: '#f0f8f4', borderColor: '#176b5b' },
                    }}
                  >
                    <CheckCircleOutlineRounded sx={{ fontSize: 16 }} />
                    {label}
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
