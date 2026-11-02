import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import LoginRounded from '@mui/icons-material/LoginRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded'
import EventAvailableRounded from '@mui/icons-material/EventAvailableRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'

import { attendanceApi, type AttendanceRecord, type AttendanceStatus } from '../api/attendance'
import { ContentCard, PageHeader, StatCard } from '../components/Layout'
import { apiMessage } from '../error'

function getStatusChipColor(status: AttendanceStatus) {
  switch (status) {
    case 'PRESENT':
      return { bg: '#e4f5ed', text: '#0e704a', border: '#b8e6d1' }
    case 'HALF_DAY':
      return { bg: '#fff4e5', text: '#b76e00', border: '#ffd8a8' }
    case 'ABSENT':
      return { bg: '#fdeeed', text: '#b02a22', border: '#f7c5c2' }
    case 'HOLIDAY':
      return { bg: '#eef2ff', text: '#3b5998', border: '#c7d2fe' }
    case 'ON_LEAVE':
      return { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' }
    default:
      return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' }
  }
}

function calculateWorkingHours(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return '—'
  const [h1, m1] = checkIn.split(':').map(Number)
  const [h2, m2] = checkOut.split(':').map(Number)
  const totalMinutes = h2 * 60 + m2 - (h1 * 60 + m1)
  if (totalMinutes <= 0) return '—'
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours}h ${mins}m`
}

export default function MyAttendancePage() {
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const todayQuery = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.getToday(),
  })

  const historyQuery = useQuery({
    queryKey: ['attendance', 'me', startDate, endDate],
    queryFn: () => attendanceApi.getMyHistory(startDate || undefined, endDate || undefined),
  })

  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn({ notes: notes || undefined }),
    onSuccess: () => {
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceApi.checkOut({ notes: notes || undefined }),
    onSuccess: () => {
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })

  const todayRecord: AttendanceRecord | null = todayQuery.data ?? null
  const history: AttendanceRecord[] = historyQuery.data ?? []

  const hasCheckedIn = Boolean(todayRecord?.checkInTime)
  const hasCheckedOut = Boolean(todayRecord?.checkOutTime)

  // Metrics
  const presentDays = history.filter((r) => r.status === 'PRESENT').length
  const halfDays = history.filter((r) => r.status === 'HALF_DAY').length
  const totalLogged = history.length

  return (
    <Box>
      <PageHeader
        eyebrow="My Workspace"
        title="My Attendance"
        subtitle="Log your daily work hours and track your monthly attendance record."
      />

      {/* Quick Check-In / Check-Out Widget */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: '1px solid #dfe6e2',
          background: 'linear-gradient(135deg, #f7faf8 0%, #eef5f1 100%)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: '#176b5b', fontWeight: 700, letterSpacing: 1.2 }}>
              Today's Session
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 650, color: '#173c35', my: 0.5 }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {todayRecord ? (
              <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Status:</Typography>
                  <Chip
                    label={todayRecord.status}
                    size="small"
                    sx={{
                      bgcolor: getStatusChipColor(todayRecord.status).bg,
                      color: getStatusChipColor(todayRecord.status).text,
                      fontWeight: 700,
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  In: <strong>{todayRecord.checkInTime || '—'}</strong> | Out: <strong>{todayRecord.checkOutTime || '—'}</strong>
                </Typography>
              </Box>
            ) : (
              <Chip label="Not Started Today" color="default" sx={{ fontWeight: 600 }} />
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #dfe6e2', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Add optional notes (e.g. WFH, client meeting)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ flex: 1, minWidth: 260, bgcolor: '#ffffff' }}
          />

          <Button
            variant="contained"
            color="primary"
            startIcon={<LoginRounded />}
            disabled={hasCheckedIn || checkInMutation.isPending}
            onClick={() => checkInMutation.mutate()}
            sx={{ minWidth: 140 }}
          >
            {hasCheckedIn ? 'Checked In' : 'Check In'}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<LogoutRounded />}
            disabled={!hasCheckedIn || checkOutMutation.isPending}
            onClick={() => checkOutMutation.mutate()}
            sx={{ minWidth: 140 }}
          >
            {hasCheckedOut ? 'Update Out' : 'Check Out'}
          </Button>
        </Box>

        {(checkInMutation.isError || checkOutMutation.isError) && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {apiMessage(checkInMutation.error ?? checkOutMutation.error)}
          </Alert>
        )}
      </Paper>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard label="Days Logged" value={totalLogged} icon={<CalendarMonthRounded />} />
        <StatCard label="Present Days" value={presentDays} icon={<CheckCircleOutlineRounded />} color="#0e704a" />
        <StatCard label="Half Days" value={halfDays} icon={<AccessTimeRounded />} color="#b76e00" />
        <StatCard label="Current Streak" value={presentDays > 0 ? `${presentDays} Days` : '0'} icon={<EventAvailableRounded />} color="#176b5b" />
      </Box>

      {/* Attendance History Table */}
      <ContentCard>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, p: '14px 16px', borderBottom: '1px solid #e6ece7' }}>
          <Box>
            <Box sx={{ fontWeight: 700 }}>Attendance History</Box>
            <Box sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>Your past check-ins and verified hours</Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <TextField
              type="date"
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <Button size="small" onClick={() => { setStartDate(''); setEndDate('') }}>
                Reset
              </Button>
            )}
          </Box>
        </Box>

        {historyQuery.isError && (
          <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
            {apiMessage(historyQuery.error)}
          </Alert>
        )}

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check-In</TableCell>
                <TableCell>Check-Out</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No attendance records found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((record) => {
                  const colors = getStatusChipColor(record.status)
                  return (
                    <TableRow key={record.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{record.date}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          size="small"
                          sx={{
                            bgcolor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        />
                      </TableCell>
                      <TableCell>{record.checkInTime || '—'}</TableCell>
                      <TableCell>{record.checkOutTime || '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#176b5b' }}>
                        {calculateWorkingHours(record.checkInTime, record.checkOutTime)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', maxWidth: 240 }}>
                        {record.notes || '—'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </ContentCard>
    </Box>
  )
}
