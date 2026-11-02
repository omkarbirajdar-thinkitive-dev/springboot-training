import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, CircularProgress, IconButton, Tooltip,
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import { createDepartment, deleteDepartment, updateDepartment, useListDepartments } from '../api/generated'
import type { Department } from '../api/contracts'
import { useSession } from '../context/SessionContext'
import { DepartmentDialog } from '../components/Forms'
import { ContentCard, PageHeader, StatCard } from '../components/Layout'
import { apiMessage } from '../error'

export default function DepartmentsPage() {
  const { isAdmin } = useSession()
  const [departmentDialog, setDepartmentDialog] = useState<Department | null | false>(false)
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries()

  const departmentQuery = useListDepartments()
  const departments = departmentQuery.data ?? []

  const departmentDelete = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: refresh,
  })
  const departmentSave = useMutation({
    mutationFn: ({ id, name, location }: { id?: number; name: string; location: string }) =>
      id ? updateDepartment(id, { name, location }) : createDepartment({ name, location }),
    onSuccess: () => { setDepartmentDialog(false); refresh() },
  })

  return (
    <Box>
      <PageHeader
        eyebrow="Organisational Structure"
        title="Departments"
        subtitle="Organize teams and the places they work."
        action={isAdmin
          ? <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDepartmentDialog(null)}>Add department</Button>
          : undefined}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 1.5, mb: 3 }}>
        <StatCard label="Teams" value={departments.length} />
        <StatCard label="People assigned" value={departments.reduce((s, d) => s + (d.employeeCount ?? 0), 0)} />
        <StatCard label="Access level" value={isAdmin ? 'Administrator' : 'Read only'} />
      </Box>

      {(departmentQuery.isError || departmentDelete.isError) && (
        <Alert severity="error" sx={{ mb: 2 }}>{apiMessage(departmentQuery.error ?? departmentDelete.error)}</Alert>
      )}

      {departmentQuery.isLoading
        ? <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>
        : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 1.5 }}>
            {departments.map((dept) => (
              <ContentCard key={dept.id}>
                <Box sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <ApartmentOutlined color="primary" />
                    {isAdmin && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => setDepartmentDialog(dept)}><EditOutlined fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => {
                            if (window.confirm(`Delete ${dept.name}? This also deletes ${dept.employeeCount ?? 0} employees assigned to it.`))
                              departmentDelete.mutate(dept.id)
                          }}><DeleteOutlineRounded fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#173c35' }}>{dept.name}</Box>
                  <Box sx={{ mt: 0.5, color: 'text.secondary', fontSize: 14 }}>{dept.location}</Box>
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #e6ece7', fontSize: 13, color: 'text.secondary' }}>
                    {dept.employeeCount ?? 0} team members
                  </Box>
                </Box>
              </ContentCard>
            ))}
            {departments.length === 0 && <Alert severity="info">No departments created yet.</Alert>}
          </Box>
        )}

      <DepartmentDialog
        open={departmentDialog !== false}
        department={departmentDialog || null}
        saving={departmentSave.isPending}
        error={departmentSave.error}
        onClose={() => setDepartmentDialog(false)}
        onSave={(values) => departmentSave.mutate(values)}
      />
    </Box>
  )
}
