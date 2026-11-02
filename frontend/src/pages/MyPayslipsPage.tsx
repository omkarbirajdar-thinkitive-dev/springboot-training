import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import PrintRounded from '@mui/icons-material/PrintRounded'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import MonetizationOnRounded from '@mui/icons-material/MonetizationOnRounded'
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded'

import { payrollApi, type PayslipRecord } from '../api/payroll'
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

export default function MyPayslipsPage() {
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null)

  const payslipsQuery = useQuery({
    queryKey: ['payslips', 'me'],
    queryFn: () => payrollApi.getMyPayslips(),
  })

  const payslips: PayslipRecord[] = payslipsQuery.data ?? []

  const latestSlip = payslips[0]
  const totalYtd = payslips.reduce((sum, p) => sum + Number(p.netSalary || 0), 0)
  const avgMonthly = payslips.length ? totalYtd / payslips.length : 0

  return (
    <Box>
      <PageHeader
        eyebrow="My Workspace"
        title="My Payslips"
        subtitle="View, verify, and print your monthly compensation payslips and tax deductions."
      />

      {/* Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard
          label="Latest Net Salary"
          value={latestSlip ? formatCurrency(latestSlip.netSalary) : '—'}
          icon={<MonetizationOnRounded />}
          color="#0e704a"
        />
        <StatCard
          label="Total Net Received"
          value={formatCurrency(totalYtd)}
          icon={<TrendingUpRounded />}
          color="#176b5b"
        />
        <StatCard
          label="Average Monthly Net"
          value={avgMonthly > 0 ? formatCurrency(avgMonthly) : '—'}
          icon={<ReceiptLongRounded />}
          color="#b46d00"
        />
      </Box>

      {/* Table Card */}
      <ContentCard>
        <Box sx={{ p: '14px 16px', borderBottom: '1px solid #e6ece7' }}>
          <Box sx={{ fontWeight: 700 }}>Published Payslips History</Box>
          <Box sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
            Official payroll receipts issued by HR administration
          </Box>
        </Box>

        {payslipsQuery.isError && (
          <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
            {apiMessage(payslipsQuery.error)}
          </Alert>
        )}

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Pay Period</TableCell>
                <TableCell align="right">Basic Salary</TableCell>
                <TableCell align="right">Allowances</TableCell>
                <TableCell align="right">Gross Salary</TableCell>
                <TableCell align="right">Deductions</TableCell>
                <TableCell align="right">Net Payout</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payslipsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : payslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No published payslips available yet.
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((p) => {
                  const totalDeductions = Number(p.taxDeduction || 0) + Number(p.otherDeductions || 0)
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>
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
                          sx={{ bgcolor: '#e4f5ed', color: '#0e704a', fontWeight: 700, fontSize: 12 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityOutlined />}
                          onClick={() => setSelectedPayslip(p)}
                        >
                          View Voucher
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </ContentCard>

      {/* Payslip Voucher Modal Dialog */}
      <Dialog
        open={Boolean(selectedPayslip)}
        onClose={() => setSelectedPayslip(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e6ece7' }}>
          <Box sx={{ fontWeight: 700 }}>Official Salary Voucher</Box>
          <Button
            size="small"
            variant="contained"
            startIcon={<PrintRounded />}
            onClick={() => window.print()}
          >
            Print Voucher
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedPayslip && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 750, color: '#173c35' }}>
                    Workforce Enterprise Inc.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Payroll Department
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#176b5b' }}>
                    Period: {MONTH_NAMES[selectedPayslip.month - 1]} {selectedPayslip.year}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Generated on {selectedPayslip.generatedAt?.split('T')[0]}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Employee info */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, bgcolor: '#f6f9f7', p: 2, borderRadius: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Employee Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 650 }}>{selectedPayslip.employeeName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Department</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 650 }}>{selectedPayslip.departmentName || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Email Address</Typography>
                  <Typography variant="body2">{selectedPayslip.employeeEmail}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Reference ID</Typography>
                  <Typography variant="body2">PAY-{selectedPayslip.id}-{selectedPayslip.month}{selectedPayslip.year}</Typography>
                </Box>
              </Box>

              {/* Earnings & Deductions Breakdown */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                {/* Earnings */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#0e704a', mb: 1 }}>
                    EARNINGS
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">Basic Salary</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(selectedPayslip.basicSalary)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">Total Allowances</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(selectedPayslip.totalAllowances)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Gross Total</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(selectedPayslip.grossSalary)}</Typography>
                  </Box>
                </Box>

                {/* Deductions */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#b02a22', mb: 1 }}>
                    DEDUCTIONS
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">Tax Withholding</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(selectedPayslip.taxDeduction)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">Health & Other</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(selectedPayslip.otherDeductions)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Deductions</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatCurrency(Number(selectedPayslip.taxDeduction) + Number(selectedPayslip.otherDeductions))}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Net Salary Highlight */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: '#176b5b',
                  color: '#ffffff',
                }}
              >
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: 1.2, opacity: 0.9 }}>
                    Net Disbursed Salary
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>Direct Bank Deposit</Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {formatCurrency(selectedPayslip.netSalary)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedPayslip(null)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
