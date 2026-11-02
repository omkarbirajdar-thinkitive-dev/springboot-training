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
  MenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import CancelRounded from '@mui/icons-material/CancelRounded'
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded'
import EventNoteRounded from '@mui/icons-material/EventNoteRounded'
import DoneAllRounded from '@mui/icons-material/DoneAllRounded'

import { leavesApi, type LeaveRecord, type LeaveStatus } from '../api/leaves'
import { useListEmployees } from '../api/generated'
import { ContentCard, PageHeader, StatCard } from '../components/Layout'
import { apiMessage } from '../error'

function getLeaveStatusChip(status: LeaveStatus) {
  switch (status) {
    case 'APPROVED':
      return { bg: '#e4f5ed', text: '#0e704a', border: '#b8e6d1' }
    case 'PENDING':
      return { bg: '#fff8e6', text: '#b46d00', border: '#ffe8a3' }
    case 'REJECTED':
      return { bg: '#fdeeed', text: '#b02a22', border: '#f7c5c2' }
    case 'CANCELLED':
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
    default:
      return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
  }
}

export default function AdminLeavesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Review modal state
  const [reviewDialog, setReviewDialog] = useState<{
    record: LeaveRecord
    action: 'approve' | 'reject'
  } | null>(null)
  const [adminComment, setAdminComment] = useState('')

  const employeesQuery = useListEmployees({ size: 100 })
  const employees = employeesQuery.data?.content ?? []

  const pendingCountQuery = useQuery({
    queryKey: ['leaves', 'pending-count'],
    queryFn: () => leavesApi.getPendingCount(),
  })

  const leavesQuery = useQuery({
    queryKey: ['leaves', 'admin', selectedEmployeeId, statusFilter, page],
    queryFn: () =>
      leavesApi.getAll({
        employeeId: selectedEmployeeId ? Number(selectedEmployeeId) : undefined,
        status: statusFilter ? (statusFilter as LeaveStatus) : undefined,
        page,
        size: 15,
      }),
  })

  const approveMutation = useMutation({
    mutationFn: (payload: { id: number; comment?: string }) =>
      leavesApi.approve(payload.id, { adminComment: payload.comment }),
    onSuccess: () => {
      setReviewDialog(null)
      setAdminComment('')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (payload: { id: number; comment?: string }) =>
      leavesApi.reject(payload.id, { adminComment: payload.comment }),
    onSuccess: () => {
      setReviewDialog(null)
      setAdminComment('')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
  })

  const handleOpenReview = (record: LeaveRecord, action: 'approve' | 'reject') => {
    setReviewDialog({ record, action })
    setAdminComment('')
  }

  const handleConfirmReview = () => {
    if (!reviewDialog) return
    if (reviewDialog.action === 'approve') {
      approveMutation.mutate({ id: reviewDialog.record.id, comment: adminComment || undefined })
    } else {
      rejectMutation.mutate({ id: reviewDialog.record.id, comment: adminComment || undefined })
    }
  }

  const records = leavesQuery.data?.content ?? []
  const totalPages = leavesQuery.data?.totalPages ?? 1
  const totalElements = leavesQuery.data?.totalElements ?? 0
  const pendingCount = pendingCountQuery.data?.pendingCount ?? 0

  return (
    <Box>
      <PageHeader
        eyebrow="Admin Workforce"
        title="Leave Management"
        subtitle="Review employee leave requests, approve time off, and monitor attendance impact."
      />

      {/* Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard
          label="Pending Approvals"
          value={pendingCount}
          icon={<HourglassEmptyRounded />}
          color={pendingCount > 0 ? '#b46d00' : '#176b5b'}
        />
        <StatCard label="Total Leave Requests" value={totalElements} icon={<EventNoteRounded />} />
        <StatCard label="All Registered Staff" value={employees.length} icon={<DoneAllRounded />} color="#176b5b" />
      </Box>

      {/* Main Table Card */}
      <ContentCard>
        {/* Filters */}
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
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending Only</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>

            {(selectedEmployeeId || statusFilter) && (
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  setSelectedEmployeeId('')
                  setStatusFilter('')
                  setPage(0)
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </Box>

        {leavesQuery.isError && (
          <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
            {apiMessage(leavesQuery.error)}
          </Alert>
        )}

        {/* Leaves Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Leave Type</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Review Note</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leavesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No leave requests found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => {
                  const colors = getLeaveStatusChip(record.status)
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
                            <Box sx={{ color: 'text.secondary', fontSize: 12 }}>{record.departmentName}</Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{record.leaveType}</TableCell>
                      <TableCell>
                        <Box sx={{ fontWeight: 600 }}>{record.totalDays} {record.totalDays === 1 ? 'day' : 'days'}</Box>
                        <Box sx={{ color: 'text.secondary', fontSize: 12 }}>{record.fromDate} → {record.toDate}</Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220, color: 'text.secondary' }}>
                        {record.reason}
                      </TableCell>
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
                      <TableCell sx={{ maxWidth: 180, fontSize: 13 }}>
                        {record.adminComment ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: 13 }}>
                              "{record.adminComment}"
                            </Typography>
                            {record.reviewedBy && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                by {record.reviewedBy}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {record.status === 'PENDING' ? (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<CheckCircleRounded />}
                              onClick={() => handleOpenReview(record, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CancelRounded />}
                              onClick={() => handleOpenReview(record, 'reject')}
                            >
                              Reject
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Completed
                          </Typography>
                        )}
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

      {/* Review Dialog */}
      <Dialog open={Boolean(reviewDialog)} onClose={() => setReviewDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {reviewDialog?.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {reviewDialog && (
            <Box sx={{ p: 1.5, bgcolor: '#f4f7f5', borderRadius: 1 }}>
              <Box sx={{ fontWeight: 650 }}>{reviewDialog.record.employeeName}</Box>
              <Box sx={{ color: 'text.secondary', fontSize: 13, mt: 0.5 }}>
                {reviewDialog.record.leaveType} Leave: {reviewDialog.record.fromDate} → {reviewDialog.record.toDate} ({reviewDialog.record.totalDays} days)
              </Box>
              <Box sx={{ color: 'text.secondary', fontSize: 13, mt: 0.5 }}>
                <strong>Reason:</strong> {reviewDialog.record.reason}
              </Box>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Comment / Notes (Optional)"
            placeholder="Add comments or instructions for the employee..."
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
          />

          {(approveMutation.isError || rejectMutation.isError) && (
            <Alert severity="error">
              {apiMessage(approveMutation.error ?? rejectMutation.error)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewDialog(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color={reviewDialog?.action === 'approve' ? 'primary' : 'error'}
            onClick={handleConfirmReview}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            {reviewDialog?.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
