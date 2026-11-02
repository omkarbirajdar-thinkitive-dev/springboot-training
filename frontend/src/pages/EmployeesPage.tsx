import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded'
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'

import { deleteEmployee, useListDepartments, useListEmployees } from '../api/generated'
import type { Employee } from '../api/contracts'
import { useSession } from '../context/SessionContext'
import { EmployeeDialog, EmployeePreviewDialog } from '../components/Forms'
import { CreateAdminDialog } from '../components/CreateAdminDialog'
import { ContentCard, PageHeader, StatCard } from '../components/Layout'
import { apiMessage } from '../error'

export default function EmployeesPage() {
  const { isAdmin, isSuperAdmin } = useSession()
  const [page, setPage] = useState(0)
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])

  // Dialogs
  const [employeeDialog, setEmployeeDialog] = useState<Employee | null | false>(false)
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null)
  const [createAdminOpen, setCreateAdminOpen] = useState(false)

  // Three-dots menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [activeEmp, setActiveEmp] = useState<Employee | null>(null)

  const queryClient = useQueryClient()
  const refresh = () => {
    setPage(0)
    setAllEmployees([])
    queryClient.invalidateQueries()
  }

  const pageSize = 12
  const employeeQuery = useListEmployees({ page, size: pageSize, department: departmentFilter || undefined })
  const departmentQuery = useListDepartments()
  const departments = departmentQuery.data ?? []

  // Accumulate employees for lazy loading
  useEffect(() => {
    if (employeeQuery.data?.content) {
      const newItems = employeeQuery.data.content
      if (page === 0) {
        setAllEmployees(newItems)
      } else {
        setAllEmployees((prev) => {
          const existingIds = new Set(prev.map((e) => e.id))
          const filtered = newItems.filter((e) => !existingIds.has(e.id))
          return [...prev, ...filtered]
        })
      }
    }
  }, [employeeQuery.data, page])

  // Reset list when filter changes
  const handleDepartmentChange = (dept: string) => {
    setDepartmentFilter(dept)
    setPage(0)
    setAllEmployees([])
  }

  // Infinite scroll listener for lazy loading
  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    const totalPages = employeeQuery.data?.totalPages ?? 1

    if (isNearBottom && !employeeQuery.isFetching && page < totalPages - 1) {
      setPage((prev) => prev + 1)
    }
  }

  const employeeDelete = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: refresh,
  })

  // Three dots menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, emp: Employee) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setActiveEmp(emp)
  }

  const handleCloseMenu = () => {
    setMenuAnchor(null)
  }

  const handlePreview = () => {
    if (activeEmp) setPreviewEmployee(activeEmp)
    handleCloseMenu()
  }

  const handleEdit = () => {
    if (activeEmp) setEmployeeDialog(activeEmp)
    handleCloseMenu()
  }

  const handleDelete = () => {
    if (activeEmp && window.confirm(`Are you sure you want to delete ${activeEmp.firstName} ${activeEmp.lastName}?`)) {
      employeeDelete.mutate(activeEmp.id)
    }
    handleCloseMenu()
  }

  const totalElements = employeeQuery.data?.totalElements ?? allEmployees.length
  const hasMore = page < (employeeQuery.data?.totalPages ?? 1) - 1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%', overflow: 'hidden' }}>
      {/* Top section: compact header & stat metrics */}
      <Box sx={{ flexShrink: 0, pt: 0, pb: { xs: 0.5, sm: 1 } }}>
        <PageHeader
          eyebrow="People Directory"
          title="Employees"
          subtitle="Manage your team members and their records."
          action={
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'row', sm: 'row' },
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
            }}>
              {isSuperAdmin && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<AdminPanelSettingsRounded />}
                  onClick={() => setCreateAdminOpen(true)}
                  sx={{ fontWeight: 700, flex: { xs: 1, sm: 'none' }, py: { xs: 0.6, sm: 0.8 }, fontSize: { xs: 12, sm: 13 } }}
                >
                  Provision Admin
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddRounded />}
                  onClick={() => setEmployeeDialog(null)}
                  sx={{ fontWeight: 700, flex: { xs: 1, sm: 'none' }, py: { xs: 0.6, sm: 0.8 }, fontSize: { xs: 12, sm: 13 } }}
                >
                  Add employee
                </Button>
              )}
            </Box>
          }
        />

        {/* Stat row: compact 3-column row fitting in one line */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: { xs: 0.75, sm: 1.5 },
          mb: { xs: 0.75, sm: 1.25 },
        }}>
          <StatCard label="In directory" value={totalElements} icon={<BadgeOutlined />} />
          <StatCard label="Departments" value={departments.length} />
          <StatCard label="Access level" value={isAdmin ? 'Admin' : 'Read only'} />
        </Box>
      </Box>

      {/* Directory Content Card */}
      <ContentCard sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
        {/* Responsive Toolbar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 0.75, sm: 1.5 },
            p: { xs: '8px 12px', sm: '12px 18px' },
            borderBottom: '1px solid #e6ece7',
            bgcolor: '#ffffff',
            flexShrink: 0,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#173c35', lineHeight: 1.2, fontSize: { xs: 14, sm: 16 } }}>
              Employee directory
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2, fontSize: { xs: 11, sm: 12 } }}>
              Showing {allEmployees.length} of {totalElements} team members {hasMore && '· scroll for more'}
            </Typography>
          </Box>
          <TextField
            select
            size="small"
            label="Department"
            value={departmentFilter}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            sx={{ width: { xs: '100%', sm: 200 } }}
          >
            <MenuItem value="">All departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.name}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {(employeeQuery.isError || employeeDelete.isError) && (
          <Alert severity="error" sx={{ mx: { xs: 1.5, sm: 2 }, mt: 1.5, flexShrink: 0 }}>
            {apiMessage(employeeQuery.error ?? employeeDelete.error)}
          </Alert>
        )}

        {/* Scrollable Container with Infinite Lazy-loading */}
        <Box
          onScroll={handleTableScroll}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* MOBILE VIEW (< sm): Clean Employee Cards for touch screens */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1, p: 1.5 }}>
            {allEmployees.map((emp) => (
              <Box
                key={emp.id}
                onClick={() => setPreviewEmployee(emp)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid #e2ebe5',
                  bgcolor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                  cursor: 'pointer',
                  '&:active': { bgcolor: '#f4fbf7' },
                }}
              >
                {/* Header row with avatar, name and 3-dots */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#deeee5', color: '#176b5b', fontSize: 13, fontWeight: 700 }}>
                      {`${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#173c35', lineHeight: 1.2 }}>
                        {emp.firstName} {emp.lastName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        #{emp.id} &middot; {emp.email}
                      </Typography>
                    </Box>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, emp)}
                    sx={{ color: '#4a6b63', p: 0.5 }}
                  >
                    <MoreVertRounded fontSize="small" />
                  </IconButton>
                </Box>

                {/* Footer details row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5, borderTop: '1px dashed #eef2ef' }}>
                  <Chip
                    size="small"
                    icon={<ApartmentOutlined sx={{ fontSize: '14px !important' }} />}
                    label={emp.department?.name ?? 'Unassigned'}
                    sx={{ bgcolor: '#f0f6f3', color: '#173c35', fontSize: 11, height: 22 }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#176b5b' }}>
                    {Number(emp.salary ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* TABLET & DESKTOP VIEW (>= sm): Full Sticky Table */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Table stickyHeader size="medium" sx={{ minWidth: 680 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#f7faf8', fontWeight: 700, color: '#173c35' }}>Employee</TableCell>
                  <TableCell sx={{ bgcolor: '#f7faf8', fontWeight: 700, color: '#173c35' }}>Email</TableCell>
                  <TableCell sx={{ bgcolor: '#f7faf8', fontWeight: 700, color: '#173c35' }}>Department</TableCell>
                  <TableCell align="right" sx={{ bgcolor: '#f7faf8', fontWeight: 700, color: '#173c35' }}>Salary</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#f7faf8', fontWeight: 700, color: '#173c35', width: 70 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allEmployees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f9fcfb' } }}
                    onClick={() => setPreviewEmployee(emp)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#deeee5', color: '#176b5b', fontSize: 13, fontWeight: 700 }}>
                          {`${emp.firstName?.[0] ?? ''}${emp.lastName?.[0] ?? ''}`.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 650, color: '#173c35' }}>
                            {emp.firstName} {emp.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            #{emp.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#2d3748' }}>
                        {emp.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#4a5568' }}>
                        {emp.department?.name ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#173c35' }}>
                        {Number(emp.salary ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, emp)}
                          sx={{
                            color: '#4a6b63',
                            '&:hover': { bgcolor: '#e8f3ee', color: '#173c35' },
                          }}
                        >
                          <MoreVertRounded />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Initial loading state */}
          {employeeQuery.isLoading && allEmployees.length === 0 && (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress size={28} />
              <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                Loading team directory…
              </Typography>
            </Box>
          )}

          {/* Empty state */}
          {!employeeQuery.isLoading && allEmployees.length === 0 && (
            <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
              No employees found matching the criteria.
            </Box>
          )}

          {/* Lazy loading spinner at bottom */}
          {employeeQuery.isFetching && page > 0 && (
            <Box sx={{ py: 2, textAlign: 'center', bgcolor: '#fafcfb' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Loading more employees…
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Card Footer summary */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1,
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1, sm: 1.25 },
            borderTop: '1px solid #e6ece7',
            bgcolor: '#ffffff',
            color: 'text.secondary',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          <span>
            {allEmployees.length >= totalElements
              ? `All ${totalElements} employees loaded`
              : `Showing ${allEmployees.length} of ${totalElements} employees (scroll down to load more)`}
          </span>
          {hasMore && (
            <Button
              size="small"
              variant="text"
              onClick={() => setPage((p) => p + 1)}
              disabled={employeeQuery.isFetching}
              sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, py: 0, px: 0 }}
            >
              Load next batch
            </Button>
          )}
        </Box>
      </ContentCard>

      {/* Production Three-Dots Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 180,
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              py: 0.5,
            },
          },
        }}
      >
        <MenuItem onClick={handlePreview} sx={{ py: 1, gap: 1.5 }}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <VisibilityOutlined fontSize="small" sx={{ color: '#176b5b' }} />
          </ListItemIcon>
          <ListItemText primary="Preview" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
        </MenuItem>

        {isAdmin && (
          <MenuItem onClick={handleEdit} sx={{ py: 1, gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <EditOutlined fontSize="small" sx={{ color: '#0e4a3b' }} />
            </ListItemIcon>
            <ListItemText primary="Edit details" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
          </MenuItem>
        )}

        {isAdmin && (
          <MenuItem onClick={handleDelete} sx={{ py: 1, gap: 1.5, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <DeleteOutlineRounded fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
          </MenuItem>
        )}
      </Menu>

      {/* Comprehensive Employee Edit & Add Dialog */}
      <EmployeeDialog
        open={employeeDialog !== false}
        employee={employeeDialog || null}
        departments={departments}
        onClose={() => setEmployeeDialog(false)}
        onSaved={refresh}
      />

      {/* Rich Employee Preview Dialog */}
      <EmployeePreviewDialog
        employee={previewEmployee}
        open={Boolean(previewEmployee)}
        onClose={() => setPreviewEmployee(null)}
        onEdit={(emp) => setEmployeeDialog(emp)}
      />

      {/* Super Admin Provision Admin Dialog */}
      <CreateAdminDialog
        open={createAdminOpen}
        departments={departments}
        onClose={() => setCreateAdminOpen(false)}
        onSuccess={refresh}
      />
    </Box>
  )
}
