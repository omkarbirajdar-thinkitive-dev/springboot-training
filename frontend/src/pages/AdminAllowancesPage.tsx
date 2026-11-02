import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
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
import AddRounded from '@mui/icons-material/AddRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded'
import PeopleOutlineRounded from '@mui/icons-material/PeopleOutlineRounded'
import PaymentsRounded from '@mui/icons-material/PaymentsRounded'

import { allowancesApi, type AllowanceRecord, type AllowanceType } from '../api/allowances'
import { useListEmployees } from '../api/generated'
import { ContentCard, PageHeader, StatCard } from '../components/Layout'
import { apiMessage } from '../error'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function AdminAllowancesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  // Create / Edit modal state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formEmployeeId, setFormEmployeeId] = useState<string>('')
  const [formType, setFormType] = useState<AllowanceType>('HRA')
  const [formAmount, setFormAmount] = useState<string>('')
  const [formEffectiveFrom, setFormEffectiveFrom] = useState('')
  const [formEffectiveTo, setFormEffectiveTo] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formError, setFormError] = useState('')

  const employeesQuery = useListEmployees({ size: 100 })
  const employees = employeesQuery.data?.content ?? []

  const allowancesQuery = useQuery({
    queryKey: ['allowances', 'admin', selectedEmployeeId, page],
    queryFn: () =>
      allowancesApi.getAll({
        employeeId: selectedEmployeeId ? Number(selectedEmployeeId) : undefined,
        page,
        size: 15,
      }),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!editingId && !formEmployeeId) {
        throw new Error('Please select an employee')
      }
      if (!formAmount || Number(formAmount) <= 0) {
        throw new Error('Please enter a valid allowance amount')
      }
      if (!formEffectiveFrom) {
        throw new Error('Please specify an effective from date')
      }

      if (editingId) {
        return allowancesApi.update(editingId, {
          type: formType,
          amount: Number(formAmount),
          effectiveFrom: formEffectiveFrom,
          effectiveTo: formEffectiveTo || undefined,
          description: formDescription || undefined,
        })
      } else {
        return allowancesApi.create({
          employeeId: Number(formEmployeeId),
          type: formType,
          amount: Number(formAmount),
          effectiveFrom: formEffectiveFrom,
          effectiveTo: formEffectiveTo || undefined,
          description: formDescription || undefined,
        })
      }
    },
    onSuccess: () => {
      setDialogOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['allowances'] })
    },
    onError: (err: unknown) => {
      setFormError(apiMessage(err))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => allowancesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowances'] })
    },
  })

  const resetForm = () => {
    setEditingId(null)
    setFormEmployeeId('')
    setFormType('HRA')
    setFormAmount('')
    setFormEffectiveFrom(new Date().toISOString().split('T')[0])
    setFormEffectiveTo('')
    setFormDescription('')
    setFormError('')
  }

  const handleOpenAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleOpenEdit = (rec: AllowanceRecord) => {
    setEditingId(rec.id)
    setFormEmployeeId(rec.employeeId.toString())
    setFormType(rec.type)
    setFormAmount(rec.amount.toString())
    setFormEffectiveFrom(rec.effectiveFrom)
    setFormEffectiveTo(rec.effectiveTo || '')
    setFormDescription(rec.description || '')
    setFormError('')
    setDialogOpen(true)
  }

  const records = allowancesQuery.data?.content ?? []
  const totalPages = allowancesQuery.data?.totalPages ?? 1
  const totalElements = allowancesQuery.data?.totalElements ?? 0
  const totalAmountInView = records.reduce((sum, r) => sum + Number(r.amount || 0), 0)

  return (
    <Box>
      <PageHeader
        eyebrow="Admin Workforce"
        title="Allowances Management"
        subtitle="Configure compensation allowances, perks, and recurring employee benefit components."
        action={
          <Button variant="contained" startIcon={<AddRounded />} onClick={handleOpenAdd}>
            Assign Allowance
          </Button>
        }
      />

      {/* Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, mb: 3 }}>
        <StatCard
          label="Total Assigned Benefits"
          value={formatCurrency(totalAmountInView)}
          icon={<PaymentsRounded />}
          color="#0e704a"
        />
        <StatCard label="Total Allowances Recorded" value={totalElements} icon={<AccountBalanceWalletRounded />} />
        <StatCard label="Eligible Staff Members" value={employees.length} icon={<PeopleOutlineRounded />} color="#176b5b" />
      </Box>

      {/* Allowances Table Card */}
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
              label="Filter by Employee"
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All Staff Members</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id.toString()}>
                  {emp.firstName} {emp.lastName} ({emp.department?.name || 'No Dept'})
                </MenuItem>
              ))}
            </TextField>

            {selectedEmployeeId && (
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  setSelectedEmployeeId('')
                  setPage(0)
                }}
              >
                Clear Filter
              </Button>
            )}
          </Box>
        </Box>

        {(allowancesQuery.isError || deleteMutation.isError) && (
          <Alert severity="error" sx={{ mx: 2, mt: 1.5 }}>
            {apiMessage(allowancesQuery.error ?? deleteMutation.error)}
          </Alert>
        )}

        {/* Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="medium" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Allowance Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Effective From</TableCell>
                <TableCell>Effective To</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allowancesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No allowance records found. Click "Assign Allowance" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec) => {
                  const initials = rec.employeeName
                    ? rec.employeeName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                    : 'U'

                  return (
                    <TableRow key={rec.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#deeee5', color: '#176b5b', fontSize: 13, fontWeight: 700 }}>
                            {initials}
                          </Avatar>
                          <Box>
                            <Box sx={{ fontWeight: 650 }}>{rec.employeeName}</Box>
                            <Box sx={{ color: 'text.secondary', fontSize: 12 }}>{rec.departmentName}</Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 650 }}>{rec.type}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#176b5b' }}>
                        {formatCurrency(Number(rec.amount))}
                      </TableCell>
                      <TableCell>{rec.effectiveFrom}</TableCell>
                      <TableCell>{rec.effectiveTo || 'Ongoing'}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', maxWidth: 220 }}>
                        {rec.description || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit allowance">
                            <IconButton size="small" onClick={() => handleOpenEdit(rec)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete allowance">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (window.confirm('Delete this allowance?')) {
                                  deleteMutation.mutate(rec.id)
                                }
                              }}
                            >
                              <DeleteOutlineRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit Allowance' : 'Assign New Allowance'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          {!editingId && (
            <TextField
              select
              fullWidth
              label="Select Employee"
              value={formEmployeeId}
              onChange={(e) => setFormEmployeeId(e.target.value)}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id.toString()}>
                  {emp.firstName} {emp.lastName} — {emp.email} ({emp.department?.name || 'No Dept'})
                </MenuItem>
              ))}
            </TextField>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="Allowance Type"
              value={formType}
              onChange={(e) => setFormType(e.target.value as AllowanceType)}
            >
              <MenuItem value="HRA">House Rent (HRA)</MenuItem>
              <MenuItem value="TRANSPORT">Transport</MenuItem>
              <MenuItem value="MEDICAL">Medical</MenuItem>
              <MenuItem value="SPECIAL">Special</MenuItem>
              <MenuItem value="PERFORMANCE_BONUS">Performance Bonus</MenuItem>
            </TextField>

            <TextField
              type="number"
              label="Monthly Amount ($)"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="e.g. 500"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              type="date"
              label="Effective From"
              InputLabelProps={{ shrink: true }}
              value={formEffectiveFrom}
              onChange={(e) => setFormEffectiveFrom(e.target.value)}
            />
            <TextField
              type="date"
              label="Effective To (Optional)"
              InputLabelProps={{ shrink: true }}
              value={formEffectiveTo}
              onChange={(e) => setFormEffectiveTo(e.target.value)}
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description / Purpose"
            placeholder="e.g. Remote work electricity and internet subsidy"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Allowance' : 'Assign Allowance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
