import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import EditOutlined from '@mui/icons-material/EditOutlined'
import TodayRounded from '@mui/icons-material/TodayRounded'
import GroupRounded from '@mui/icons-material/GroupRounded'
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'

import { attendanceApi, type AttendanceRecord, type AttendanceStatus } from '../api/attendance'
import { useListEmployees } from '../api/generated'
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

export default function AdminAttendancePage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)

  // Edit form state
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT')
  const [editCheckIn, setEditCheckIn] = useState('')
  const [editCheckOut, setEditCheckOut] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const employeesQuery = useListEmployees({ size: 100 })
  const employees = employeesQuery.data?.content ?? []

  const attendanceQuery = useQuery({
    queryKey: ['attendance', 'admin', selectedEmployeeId, startDate, endDate, page],
    queryFn: () =>
      attendanceApi.getAll({
        employeeId: selectedEmployeeId ? Number(selectedEmployeeId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: 15,
      }),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: Parameters<typeof attendanceApi.update>[1] }) =>
      attendanceApi.update(payload.id, payload.data),
    onSuccess: () => {
      setEditingRecord(null)
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })

  const handleOpenEdit = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setEditStatus(record.status)
    setEditCheckIn(record.checkInTime || '')
    setEditCheckOut(record.checkOutTime || '')
    setEditNotes(record.notes || '')
  }

  const handleSaveEdit = () => {
    if (!editingRecord) return
    updateMutation.mutate({
      id: editingRecord.id,
      data: {
        status: editStatus,
        checkInTime: editCheckIn || undefined,
        checkOutTime: editCheckOut || undefined,
        notes: editNotes || undefined,
      },
    })
  }

  const handleFilterToday = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    setStartDate(todayStr)
    setEndDate(todayStr)
    setPage(0)
  }

  const handleClearFilters = () => {
    setSelectedEmployeeId('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

  const records = attendanceQuery.data?.content ?? []
  const totalPages = attendanceQuery.data?.totalPages ?? 1
  const totalElements = attendanceQuery.data?.totalElements ?? 0

  const presentCount = records.filter((r) => r.status === 'PRESENT').length
  const halfDayCount = records.filter((r) => r.status === 'HALF_DAY').length

  return (
    <Box>
      <PageHeader
        eyebrow="Admin Workforce"
        title="Attendance Management"
        subtitle="Monitor company-wide employee attendance, verify check-ins, and correct records."
      />

      {/* Metric Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard label="Total Records Found" value={totalElements} icon={<GroupRounded />} />
        <StatCard label="Present in View" value={presentCount} icon={<CheckCircleOutlineRounded />} color="#0e704a" />
        <StatCard label="Half Days in View" value={halfDayCount} icon={<AccessTimeRounded />} color="#b76e00" />
        <StatCard label="Total Staff Members" value={employees.length} icon={<TodayRounded />} color="#176b5b" />
      </Box>

      {/* Main Table Card */}
      <ContentCard>
        {/* Filter Toolbar */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: '14px 16px',
            borderBottom: '1px solid #e6ece7',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <TextField
              select
              size="small"
              label="Employee"
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All Employees</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id.toString()}>
                  {emp.firstName} {emp.lastName} ({emp.department?.name || 'No Dept'})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(0)
              }}
            />

            <TextField
              type="date"
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(0)
              }}
            />

            <Button variant="outlined" size="small" onClick={handleFilterToday} startIcon={<TodayRounded />}>
              Today
            </Button>

            {(selectedEmployeeId || startDate || endDate) && (
              <Button size="small" color="inherit" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </Box>
        </Box>

        {attendanceQuery.isError && (
          <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
            {apiMessage(attendanceQuery.error)}
          </Alert>
        )}

        {/* Attendance Records Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check-In</TableCell>
                <TableCell>Check-Out</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No attendance records found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => {
                  const colors = getStatusChipColor(record.status)
                  const initials = record.employeeName
                    ? record.employeeName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : 'U'

                  return (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#deeee5', color: '#176b5b', fontSize: 13, fontWeight: 700 }}>
                            {initials}
                          </Avatar>
                          <Box>
                            <Box sx={{ fontWeight: 650 }}>{record.employeeName}</Box>
                            <Box sx={{ color: 'text.secondary', fontSize: 12 }}>{record.employeeEmail}</Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{record.departmentName || '—'}</TableCell>
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
                      <TableCell sx={{ color: 'text.secondary', maxWidth: 200 }}>
                        {record.notes || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit attendance record">
                          <IconButton size="small" onClick={() => handleOpenEdit(record)}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid #e6ece7' }}>
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(_, newPage) => setPage(newPage - 1)}
              color="primary"
            />
          </Box>
        )}
      </ContentCard>

      {/* Edit Record Modal Dialog */}
      <Dialog open={Boolean(editingRecord)} onClose={() => setEditingRecord(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Attendance Record</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {editingRecord && (
            <Box sx={{ mb: 1, p: 1.5, bgcolor: '#f4f7f5', borderRadius: 1 }}>
              <Box sx={{ fontWeight: 600 }}>{editingRecord.employeeName}</Box>
              <Box sx={{ color: 'text.secondary', fontSize: 13 }}>
                Date: {editingRecord.date} | {editingRecord.departmentName}
              </Box>
            </Box>
          )}

          <TextField
            select
            fullWidth
            size="small"
            label="Attendance Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
          >
            <MenuItem value="PRESENT">PRESENT</MenuItem>
            <MenuItem value="HALF_DAY">HALF_DAY</MenuItem>
            <MenuItem value="ABSENT">ABSENT</MenuItem>
            <MenuItem value="HOLIDAY">HOLIDAY</MenuItem>
            <MenuItem value="ON_LEAVE">ON_LEAVE</MenuItem>
          </TextField>

          <TextField
            fullWidth
            size="small"
            label="Check-In Time (HH:mm:ss)"
            placeholder="09:00:00"
            value={editCheckIn}
            onChange={(e) => setEditCheckIn(e.target.value)}
          />

          <TextField
            fullWidth
            size="small"
            label="Check-Out Time (HH:mm:ss)"
            placeholder="17:30:00"
            value={editCheckOut}
            onChange={(e) => setEditCheckOut(e.target.value)}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Notes"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />

          {updateMutation.isError && (
            <Alert severity="error">{apiMessage(updateMutation.error)}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingRecord(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
