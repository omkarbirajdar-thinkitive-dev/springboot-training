import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import EventNoteRounded from '@mui/icons-material/EventNoteRounded'
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded'
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded'
import HighlightOffRounded from '@mui/icons-material/HighlightOffRounded'

import { leavesApi, type LeaveRecord, type LeaveStatus, type LeaveType } from '../api/leaves'
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

export default function MyLeavesPage() {
  const queryClient = useQueryClient()
  const [openApplyDialog, setOpenApplyDialog] = useState(false)

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')

  const leavesQuery = useQuery({
    queryKey: ['leaves', 'me'],
    queryFn: () => leavesApi.getMyLeaves(),
  })

  const applyMutation = useMutation({
    mutationFn: () => {
      if (!fromDate || !toDate) {
        throw new Error('Please select both from and to dates')
      }
      if (toDate < fromDate) {
        throw new Error('End date cannot be earlier than start date')
      }
      if (!reason.trim()) {
        throw new Error('Please provide a reason for the leave')
      }
      return leavesApi.apply({
        leaveType,
        fromDate,
        toDate,
        reason,
      })
    },
    onSuccess: () => {
      setOpenApplyDialog(false)
      setFromDate('')
      setToDate('')
      setReason('')
      setFormError('')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (err: unknown) => {
      setFormError(apiMessage(err))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => leavesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
  })

  const leaves: LeaveRecord[] = leavesQuery.data ?? []
  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED')
  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING')
  const totalDaysTaken = approvedLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0)

  return (
    <Box>
      <PageHeader
        eyebrow="My Workspace"
        title="My Leaves"
        subtitle="Submit time off requests, check approval progress, and view leave balances."
        action={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => {
              setFormError('')
              setOpenApplyDialog(true)
            }}
          >
            Apply for Leave
          </Button>
        }
      />

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard label="Approved Days" value={`${totalDaysTaken} Days`} icon={<CheckCircleOutlineRounded />} color="#0e704a" />
        <StatCard label="Pending Approval" value={pendingLeaves.length} icon={<HourglassEmptyRounded />} color="#b46d00" />
        <StatCard label="Total Requests" value={leaves.length} icon={<EventNoteRounded />} color="#176b5b" />
      </Box>

      {/* Requests Table */}
      <ContentCard>
        <Box sx={{ p: '14px 16px', borderBottom: '1px solid #e6ece7' }}>
          <Box sx={{ fontWeight: 700 }}>Leave Applications History</Box>
          <Box sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
            Track the status of your past and pending applications
          </Box>
        </Box>

        {leavesQuery.isError && (
          <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
            {apiMessage(leavesQuery.error)}
          </Alert>
        )}

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="center">Duration</TableCell>
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
              ) : leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No leave requests found. Click "Apply for Leave" above to submit one.
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((l) => {
                  const colors = getLeaveStatusChip(l.status)
                  return (
                    <TableRow key={l.id} hover>
                      <TableCell sx={{ fontWeight: 650 }}>{l.leaveType}</TableCell>
                      <TableCell>
                        {l.fromDate} → {l.toDate}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {l.totalDays} {l.totalDays === 1 ? 'day' : 'days'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220, color: 'text.secondary' }}>
                        {l.reason}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={l.status}
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
                      <TableCell sx={{ maxWidth: 200, fontSize: 13 }}>
                        {l.adminComment ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: 13 }}>
                              "{l.adminComment}"
                            </Typography>
                            {l.reviewedBy && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                by {l.reviewedBy}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {l.status === 'PENDING' && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<HighlightOffRounded />}
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(l.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </ContentCard>

      {/* Apply Leave Modal Dialog */}
      <Dialog open={openApplyDialog} onClose={() => setOpenApplyDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Apply for Leave</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <TextField
            select
            fullWidth
            label="Leave Type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          >
            <MenuItem value="CASUAL">Casual Leave (Casual / Personal)</MenuItem>
            <MenuItem value="SICK">Sick Leave (Medical / Health)</MenuItem>
            <MenuItem value="EARNED">Earned / Annual Vacation Leave</MenuItem>
            <MenuItem value="UNPAID">Unpaid / Leave Without Pay</MenuItem>
          </TextField>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <TextField
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Leave"
            placeholder="Please provide details about your leave request..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenApplyDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
          >
            {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
