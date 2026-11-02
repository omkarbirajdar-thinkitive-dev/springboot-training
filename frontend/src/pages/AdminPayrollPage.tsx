import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import AddRounded from '@mui/icons-material/AddRounded'
import PublishRounded from '@mui/icons-material/PublishRounded'
import MonetizationOnRounded from '@mui/icons-material/MonetizationOnRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded'

import { payrollApi, type PayslipStatus } from '../api/payroll'
import { useListEmployees } from '../api/generated'
import { ContentCard, PageHeader, StatCard } from '../components/Layout'
import { apiMessage } from '../error'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function AdminPayrollPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // Generate modal state
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false)
  const [genEmployeeId, setGenEmployeeId] = useState<string>('')
  const [genMonth, setGenMonth] = useState<number>(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState<number>(new Date().getFullYear())
  const [genPublish, setGenPublish] = useState(true)
  const [genError, setGenError] = useState('')

  const employeesQuery = useListEmployees({ size: 100 })
  const employees = employeesQuery.data?.content ?? []

  const payrollQuery = useQuery({
    queryKey: ['payslips', 'admin', selectedEmployeeId, selectedMonth, selectedYear, selectedStatus, page],
    queryFn: () =>
      payrollApi.getAll({
        employeeId: selectedEmployeeId ? Number(selectedEmployeeId) : undefined,
        month: selectedMonth ? Number(selectedMonth) : undefined,
        year: selectedYear ? Number(selectedYear) : undefined,
        status: selectedStatus ? (selectedStatus as PayslipStatus) : undefined,
        page,
        size: 15,
      }),
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      payrollApi.generate({
        employeeId: genEmployeeId ? Number(genEmployeeId) : undefined,
        month: genMonth,
        year: genYear,
        publishImmediately: genPublish,
      }),
    onSuccess: () => {
      setOpenGenerateDialog(false)
      setGenError('')
      queryClient.invalidateQueries({ queryKey: ['payslips'] })
    },
    onError: (err: unknown) => {
      setGenError(apiMessage(err))
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: number) => payrollApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] })
    },
  })

  const records = payrollQuery.data?.content ?? []
  const totalPages = payrollQuery.data?.totalPages ?? 1
  const totalElements = payrollQuery.data?.totalElements ?? 0

  const totalPayrollAmount = records.reduce((sum, p) => sum + Number(p.netSalary || 0), 0)
  const draftCount = records.filter((p) => p.status === 'DRAFT').length

  return (
    <Box>
      <PageHeader
        eyebrow="Admin Workforce"
        title="Payroll & Billing"
        subtitle="Generate monthly payslips, calculate allowances and taxes, and publish official payouts."
        action={
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => {
              setGenError('')
              setOpenGenerateDialog(true)
            }}
          >
            Run Payroll Generation
          </Button>
        }
      />

      {/* Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard
          label="Total Net Payroll"
          value={formatCurrency(totalPayrollAmount)}
          icon={<MonetizationOnRounded />}
          color="#0e704a"
        />
        <StatCard label="Total Payslips Recorded" value={totalElements} icon={<ReceiptLongRounded />} />
        <StatCard
          label="Drafts Pending Release"
          value={draftCount}
          icon={<HourglassEmptyRounded />}
          color={draftCount > 0 ? '#b46d00' : '#176b5b'}
        />
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
              label="Staff Member"
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All Staff Members</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id.toString()}>
                  {emp.firstName} {emp.lastName} ({emp.department?.name || 'No Dept'})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Months</MenuItem>
              {MONTH_NAMES.map((name, idx) => (
                <MenuItem key={name} value={(idx + 1).toString()}>
                  {name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Year"
              type="number"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value)
                setPage(0)
              }}
              sx={{ width: 100 }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
            </TextField>

            {(selectedEmployeeId || selectedMonth || selectedStatus) && (
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  setSelectedEmployeeId('')
                  setSelectedMonth('')
                  setSelectedStatus('')
                  setPage(0)
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </Box>

        {(payrollQuery.isError || publishMutation.isError) && (
          <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
            {apiMessage(payrollQuery.error ?? publishMutation.error)}
          </Alert>
        )}

        {/* Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Period</TableCell>
                <TableCell align="right">Basic</TableCell>
                <TableCell align="right">Allowances</TableCell>
                <TableCell align="right">Gross</TableCell>
                <TableCell align="right">Deductions</TableCell>
                <TableCell align="right">Net Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrollQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No payslips found matching filters. Click "Run Payroll Generation" to issue new records.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((p) => {
                  const totalDeductions = Number(p.taxDeduction || 0) + Number(p.otherDeductions || 0)
                  const initials = p.employeeName
                    ? p.employeeName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : 'U'

                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#deeee5', color: '#176b5b', fontSize: 13, fontWeight: 700 }}>
                            {initials}
                          </Avatar>
                          <Box>
                            <Box sx={{ fontWeight: 650 }}>{p.employeeName}</Box>
                            <Box sx={{ color: 'text.secondary', fontSize: 12 }}>{p.departmentName}</Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {MONTH_NAMES[p.month - 1]} {p.year}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(p.basicSalary)}</TableCell>
                      <TableCell align="right" sx={{ color: '#0e704a' }}>
                        +{formatCurrency(p.totalAllowances)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(p.grossSalary)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#b02a22' }}>
                        -{formatCurrency(totalDeductions)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 750, color: '#176b5b', fontSize: 15 }}>
                        {formatCurrency(p.netSalary)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            bgcolor: p.status === 'PUBLISHED' ? '#e4f5ed' : '#fff8e6',
                            color: p.status === 'PUBLISHED' ? '#0e704a' : '#b46d00',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {p.status === 'DRAFT' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<PublishRounded />}
                            disabled={publishMutation.isPending}
                            onClick={() => publishMutation.mutate(p.id)}
                          >
                            Publish
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

      {/* Generate Payroll Dialog */}
      <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Generate Monthly Payslips</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {genError && <Alert severity="error">{genError}</Alert>}

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Calculates gross salary, includes all active allowances, applies standard withholding deductions, and computes net disbursement.
          </Typography>

          <TextField
            select
            fullWidth
            label="Target Staff"
            value={genEmployeeId}
            onChange={(e) => setGenEmployeeId(e.target.value)}
          >
            <MenuItem value="">All Employees (Batch Run)</MenuItem>
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id.toString()}>
                {emp.firstName} {emp.lastName} ({emp.department?.name || 'No Dept'})
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Payroll Month"
              value={genMonth}
              onChange={(e) => setGenMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((name, idx) => (
                <MenuItem key={name} value={idx + 1}>
                  {name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="number"
              label="Year"
              value={genYear}
              onChange={(e) => setGenYear(Number(e.target.value))}
            />
          </Box>

          <FormControlLabel
            control={<Checkbox checked={genPublish} onChange={(e) => setGenPublish(e.target.checked)} color="primary" />}
            label="Publish immediately (visible to employees)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenGenerateDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Generating...' : 'Start Calculation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
