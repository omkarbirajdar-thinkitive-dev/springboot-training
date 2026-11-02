import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import DownloadRounded from '@mui/icons-material/DownloadRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import BeachAccessRounded from '@mui/icons-material/BeachAccessRounded'

import { reportsApi } from '../api/reports'
import { PageHeader } from '../components/Layout'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function AdminReportsPage() {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // Attendance Report filters
  const [attMonth, setAttMonth] = useState<number>(currentMonth)
  const [attYear, setAttYear] = useState<number>(currentYear)
  const [attDownloading, setAttDownloading] = useState(false)

  // Payroll Report filters
  const [payMonth, setPayMonth] = useState<number>(currentMonth)
  const [payYear, setPayYear] = useState<number>(currentYear)
  const [payDownloading, setPayDownloading] = useState(false)

  // Leave Report filters
  const [leaveYear, setLeaveYear] = useState<number>(currentYear)
  const [leaveDownloading, setLeaveDownloading] = useState(false)

  const handleDownloadAttendance = async () => {
    try {
      setAttDownloading(true)
      await reportsApi.downloadAttendanceReport(attMonth, attYear)
    } finally {
      setAttDownloading(false)
    }
  }

  const handleDownloadPayroll = async () => {
    try {
      setPayDownloading(true)
      await reportsApi.downloadPayrollReport(payMonth, payYear)
    } finally {
      setPayDownloading(false)
    }
  }

  const handleDownloadLeaves = async () => {
    try {
      setLeaveDownloading(true)
      await reportsApi.downloadLeaveReport(leaveYear)
    } finally {
      setLeaveDownloading(false)
    }
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Admin Workforce Analytics"
        title="Reports & Data Export"
        subtitle="Generate and download audit-ready CSV reports for attendance compliance, monthly payroll, and leave trends."
      />

      <Grid container spacing={3}>
        {/* Attendance Report Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ height: '100%', border: '1px solid #dfe6e2', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<CalendarMonthRounded sx={{ color: '#176b5b', fontSize: 32 }} />}
              title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Attendance Ledger</Typography>}
              subheader="Daily check-in / check-out records and status codes"
            />
            <Divider />
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Exports employee name, department, date, exact check-in & check-out timestamps, verification status, and employee notes.
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1.5 }}>
                <TextField
                  select
                  size="small"
                  label="Month"
                  value={attMonth}
                  onChange={(e) => setAttMonth(Number(e.target.value))}
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <MenuItem key={name} value={idx + 1}>
                      {name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  type="number"
                  label="Year"
                  value={attYear}
                  onChange={(e) => setAttYear(Number(e.target.value))}
                />
              </Box>

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadRounded />}
                  onClick={handleDownloadAttendance}
                  disabled={attDownloading}
                >
                  {attDownloading ? 'Generating CSV...' : 'Download Attendance CSV'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payroll Report Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ height: '100%', border: '1px solid #dfe6e2', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<ReceiptLongRounded sx={{ color: '#0e704a', fontSize: 32 }} />}
              title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payroll Summary</Typography>}
              subheader="Base salary, allowances, taxes, and net disbursements"
            />
            <Divider />
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Exports comprehensive company payroll register including basic pay, categorized allowances, gross salary, tax deductions, and net paid.
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1.5 }}>
                <TextField
                  select
                  size="small"
                  label="Month"
                  value={payMonth}
                  onChange={(e) => setPayMonth(Number(e.target.value))}
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <MenuItem key={name} value={idx + 1}>
                      {name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  type="number"
                  label="Year"
                  value={payYear}
                  onChange={(e) => setPayYear(Number(e.target.value))}
                />
              </Box>

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadRounded />}
                  onClick={handleDownloadPayroll}
                  disabled={payDownloading}
                >
                  {payDownloading ? 'Generating CSV...' : 'Download Payroll CSV'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Utilization Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ height: '100%', border: '1px solid #dfe6e2', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              avatar={<BeachAccessRounded sx={{ color: '#b46d00', fontSize: 32 }} />}
              title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Leave Utilization</Typography>}
              subheader="Annual employee absence and leave ledger"
            />
            <Divider />
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Exports all leave applications, leave categories (Sick, Casual, Earned, Unpaid), approved dates, reviewer usernames, and admin comments.
              </Typography>

              <TextField
                size="small"
                type="number"
                label="Calendar Year"
                value={leaveYear}
                onChange={(e) => setLeaveYear(Number(e.target.value))}
              />

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadRounded />}
                  onClick={handleDownloadLeaves}
                  disabled={leaveDownloading}
                >
                  {leaveDownloading ? 'Generating CSV...' : 'Download Leaves CSV'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
