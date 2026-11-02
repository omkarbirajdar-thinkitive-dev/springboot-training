import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import SavingsRounded from '@mui/icons-material/SavingsRounded'
import StarBorderRounded from '@mui/icons-material/StarBorderRounded'

import { allowancesApi, type AllowanceRecord, type AllowanceType } from '../api/allowances'
import { ContentCard, PageHeader, StatCard } from '../components/Layout'
import { apiMessage } from '../error'

function getAllowanceTypeLabel(type: AllowanceType) {
  switch (type) {
    case 'HRA':
      return 'House Rent Allowance (HRA)'
    case 'TRANSPORT':
      return 'Transport Allowance'
    case 'MEDICAL':
      return 'Medical Allowance'
    case 'SPECIAL':
      return 'Special Allowance'
    case 'PERFORMANCE_BONUS':
      return 'Performance Bonus'
    default:
      return type
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function MyAllowancesPage() {
  const allowancesQuery = useQuery({
    queryKey: ['allowances', 'me'],
    queryFn: () => allowancesApi.getMyAllowances(),
  })

  const allowances: AllowanceRecord[] = allowancesQuery.data ?? []

  const todayStr = new Date().toISOString().split('T')[0]
  const activeAllowances = allowances.filter(
    (a) => a.effectiveFrom <= todayStr && (!a.effectiveTo || a.effectiveTo >= todayStr)
  )

  const totalMonthlyAllowance = activeAllowances.reduce((sum, a) => sum + Number(a.amount || 0), 0)
  const maxAllowance = activeAllowances.length
    ? Math.max(...activeAllowances.map((a) => Number(a.amount || 0)))
    : 0

  return (
    <Box>
      <PageHeader
        eyebrow="My Workspace"
        title="My Allowances"
        subtitle="Review your monthly salary benefits, allowances breakdown, and compensation add-ons."
      />

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard
          label="Total Monthly Benefits"
          value={formatCurrency(totalMonthlyAllowance)}
          icon={<AccountBalanceWalletRounded />}
          color="#0e704a"
        />
        <StatCard
          label="Active Allowances"
          value={activeAllowances.length}
          icon={<SavingsRounded />}
          color="#176b5b"
        />
        <StatCard
          label="Top Component"
          value={maxAllowance > 0 ? formatCurrency(maxAllowance) : '—'}
          icon={<StarBorderRounded />}
          color="#b46d00"
        />
      </Box>

      {/* Allowances Table */}
      <ContentCard>
        <Box sx={{ p: '14px 16px', borderBottom: '1px solid #e6ece7' }}>
          <Box sx={{ fontWeight: 700 }}>Allowances & Perks Breakdown</Box>
          <Box sx={{ color: 'text.secondary', fontSize: 13, mt: 0.3 }}>
            Structured components added to your monthly base payroll
          </Box>
        </Box>

        {allowancesQuery.isError && (
          <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
            {apiMessage(allowancesQuery.error)}
          </Alert>
        )}

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Benefit Component</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Effective Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Description / Terms</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allowancesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : allowances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No allowances currently assigned to your profile.
                  </TableCell>
                </TableRow>
              ) : (
                allowances.map((item) => {
                  const isActive =
                    item.effectiveFrom <= todayStr && (!item.effectiveTo || item.effectiveTo >= todayStr)
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 650 }}>
                        {getAllowanceTypeLabel(item.type)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#176b5b' }}>
                        {formatCurrency(Number(item.amount))}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          From: <strong>{item.effectiveFrom}</strong>
                        </Typography>
                        {item.effectiveTo && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            To: {item.effectiveTo}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isActive ? 'Active' : 'Expired'}
                          size="small"
                          sx={{
                            bgcolor: isActive ? '#e4f5ed' : '#f3f4f6',
                            color: isActive ? '#0e704a' : '#6b7280',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', maxWidth: 260 }}>
                        {item.description || 'Standard monthly allowance'}
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
