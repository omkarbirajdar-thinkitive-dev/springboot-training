import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import EditOutlined from '@mui/icons-material/EditOutlined'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import PhoneOutlined from '@mui/icons-material/PhoneOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import CakeOutlined from '@mui/icons-material/CakeOutlined'
import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined'

import { createEmployee, upsertEmployeeProfile, updateEmployee } from '../api/generated'
import type { Department, Employee } from '../api/contracts'
import { apiMessage } from '../error'

const employeeSchema = z.object({
  firstName: z.string().trim().min(2, 'Use at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Use at least 2 characters').max(50),
  email: z.email('Enter a valid email'),
  salary: z.coerce.number().positive('Salary must be greater than zero'),
  departmentId: z.coerce.number().int().positive('Choose a department'),
  phone: z.string().trim().regex(/^$|^[+]?[0-9]{7,15}$/, 'Use 7–15 digits, optionally starting with +').optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
})
type EmployeeValues = z.infer<typeof employeeSchema>

export function EmployeeDialog({
  open,
  employee,
  departments,
  onClose,
  onSaved,
}: {
  open: boolean
  employee: Employee | null
  departments: Department[]
  onClose: () => void
  onSaved: () => void
}) {
  const [createdInfo, setCreatedInfo] = useState<{ username?: string; password?: string; email: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'employment' | 'personal'>('employment')

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<z.input<typeof employeeSchema>, unknown, EmployeeValues>({
    resolver: zodResolver(employeeSchema),
  })

  const mutation = useMutation({
    mutationFn: async (values: EmployeeValues) => {
      if (employee) {
        // Edit flow: update both core and profile
        const empRes = await updateEmployee(employee.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          salary: values.salary,
          departmentId: values.departmentId,
        })
        if (values.phone || values.address || values.dateOfBirth) {
          await upsertEmployeeProfile(employee.id, {
            phone: values.phone || undefined,
            address: values.address || undefined,
            dateOfBirth: values.dateOfBirth || undefined,
          })
        }
        return empRes
      } else {
        // Create flow
        const created = await createEmployee({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          salary: values.salary,
          departmentId: values.departmentId,
        })
        if (created?.id && (values.phone || values.address || values.dateOfBirth)) {
          try {
            await upsertEmployeeProfile(created.id, {
              phone: values.phone || undefined,
              address: values.address || undefined,
              dateOfBirth: values.dateOfBirth || undefined,
            })
          } catch (e) {
            console.error('Failed to save profile during employee creation', e)
          }
        }
        return created
      }
    },
    onSuccess: (data, variables) => {
      if (!employee && data) {
        setCreatedInfo({
          username: data.username,
          password: data.temporaryPassword,
          email: variables.email,
        })
      } else {
        onClose()
        onSaved()
      }
    },
  })

  useEffect(() => {
    if (open) {
      setCreatedInfo(null)
      setActiveTab('employment')
      reset(employee ? {
        firstName: employee.firstName ?? '',
        lastName: employee.lastName ?? '',
        email: employee.email ?? '',
        salary: Number(employee.salary ?? 0),
        departmentId: employee.department?.id ?? 0,
        phone: employee.profile?.phone ?? '',
        address: employee.profile?.address ?? '',
        dateOfBirth: employee.profile?.dateOfBirth ?? '',
      } : {
        firstName: '',
        lastName: '',
        email: '',
        salary: 0,
        departmentId: 0,
        phone: '',
        address: '',
        dateOfBirth: '',
      })
    }
  }, [employee, open, reset])

  const handleFinish = () => {
    setCreatedInfo(null)
    onClose()
    onSaved()
  }

  return (
    <Dialog
      open={open}
      onClose={createdInfo ? handleFinish : onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 1.5, sm: 2 },
          width: { xs: 'calc(100% - 24px)', sm: 'auto' },
          maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 64px)' },
          borderRadius: { xs: 2.5, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {createdInfo ? (
        <>
          <DialogTitle sx={{ fontWeight: 700, color: '#173c35', flexShrink: 0 }}>Employee Created & Credentials Dispatched</DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important', overflowY: 'auto' }}>
            <Alert severity="success">
              The employee was successfully enrolled. Login credentials have been dispatched to <strong>{createdInfo.email}</strong>.
            </Alert>
            <Box sx={{ p: 2, bgcolor: '#f4fbf7', borderRadius: 2, border: '1px solid #d8ece2' }}>
              <Typography variant="subtitle2" sx={{ color: '#173c35', fontWeight: 700, mb: 1 }}>
                Provisioned Portal Credentials:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Username:</strong> <code>{createdInfo.username}</code>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Temporary Password:</strong> <code>{createdInfo.password}</code>
              </Typography>
              <Typography variant="caption" sx={{ color: '#4a6b63', display: 'block' }}>
                The employee can now sign in at the login screen using these credentials.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, flexShrink: 0 }}>
            <Button variant="contained" onClick={handleFinish}>
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ pb: 1, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#173c35' }}>
                  {employee ? `Edit Employee: ${employee.firstName} ${employee.lastName}` : 'Add New Employee'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#667873' }}>
                  {employee ? 'Update employment details and personal contact profile' : 'Enroll team member and auto-provision portal account'}
                </Typography>
              </Box>
              {employee && (
                <Chip size="small" label={`ID #${employee.id}`} sx={{ bgcolor: '#e2f0e9', color: '#173c35', fontWeight: 700 }} />
              )}
            </Box>

            {/* Sub-tab navigation */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, borderBottom: '1px solid #e0e6e2' }}>
              <Button
                size="small"
                variant={activeTab === 'employment' ? 'contained' : 'text'}
                onClick={() => setActiveTab('employment')}
                sx={{ borderRadius: '6px 6px 0 0', textTransform: 'none', fontWeight: 600, py: 0.7 }}
              >
                Employment Details
              </Button>
              <Button
                size="small"
                variant={activeTab === 'personal' ? 'contained' : 'text'}
                onClick={() => setActiveTab('personal')}
                sx={{ borderRadius: '6px 6px 0 0', textTransform: 'none', fontWeight: 600, py: 0.7 }}
              >
                Personal & Contact Info
              </Button>
            </Box>
          </DialogTitle>

          <Box
            component="form"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
          >
            <DialogContent sx={{ display: 'grid', gap: 2, pt: '16px !important', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {!employee && (
                <Box sx={{ p: 1.5, bgcolor: '#f4fbf7', borderRadius: 1.5, border: '1px solid #d8ece2' }}>
                  <Typography variant="caption" sx={{ color: '#173c35', display: 'block', lineHeight: 1.4 }}>
                    ✉️ <strong>Automated Account Provisioning:</strong> A Keycloak portal account will be automatically generated, and login credentials dispatched to their email address.
                  </Typography>
                </Box>
              )}

              {mutation.isError && <Alert severity="error">{apiMessage(mutation.error)}</Alert>}

              {activeTab === 'employment' && (
                <>
                  <div className="profile-grid">
                    <TextField
                      label="First name"
                      {...register('firstName')}
                      error={Boolean(errors.firstName)}
                      helperText={errors.firstName?.message}
                      fullWidth
                    />
                    <TextField
                      label="Last name"
                      {...register('lastName')}
                      error={Boolean(errors.lastName)}
                      helperText={errors.lastName?.message}
                      fullWidth
                    />
                  </div>

                  <TextField
                    label="Email Address"
                    type="email"
                    {...register('email')}
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    fullWidth
                  />

                  <div className="profile-grid">
                    <TextField
                      label="Annual Salary ($)"
                      type="number"
                      inputProps={{ min: 0, step: 'any' }}
                      {...register('salary')}
                      error={Boolean(errors.salary)}
                      helperText={errors.salary?.message}
                      fullWidth
                    />
                    <Controller
                      name="departmentId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          label="Department"
                          {...field}
                          error={Boolean(errors.departmentId)}
                          helperText={errors.departmentId?.message}
                          fullWidth
                        >
                          <MenuItem value={0} disabled>Select department</MenuItem>
                          {departments.map((department) => (
                            <MenuItem key={department.id} value={department.id}>
                              {department.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </div>
                </>
              )}

              {activeTab === 'personal' && (
                <>
                  <div className="profile-grid">
                    <TextField
                      label="Phone Number"
                      placeholder="+1 (555) 000-0000"
                      {...register('phone')}
                      error={Boolean(errors.phone)}
                      helperText={errors.phone?.message || 'Optional contact phone number'}
                      fullWidth
                    />
                    <TextField
                      label="Date of Birth"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      {...register('dateOfBirth')}
                      error={Boolean(errors.dateOfBirth)}
                      helperText={errors.dateOfBirth?.message}
                      fullWidth
                    />
                  </div>

                  <TextField
                    label="Residential Address"
                    placeholder="Street, City, State, ZIP code"
                    multiline
                    minRows={3}
                    {...register('address')}
                    error={Boolean(errors.address)}
                    helperText={errors.address?.message || 'Optional physical residence address'}
                    fullWidth
                  />
                </>
              )}
            </DialogContent>

            <DialogActions
              sx={{
                px: { xs: 2, sm: 3 },
                pb: { xs: 2, sm: 2.5 },
                display: 'flex',
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                justifyContent: 'space-between',
                gap: 1.5,
                '& > *': { width: { xs: '100%', sm: 'auto' } },
                flexShrink: 0,
              }}
            >
              <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                {activeTab === 'employment' ? (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setActiveTab('personal')}
                    fullWidth
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Next: Personal Info →
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setActiveTab('employment')}
                    fullWidth
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    ← Back: Employment Details
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, '& > *': { flex: { xs: 1, sm: 'none' } } }}>
                <Button onClick={onClose} disabled={mutation.isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={mutation.isPending || departments.length === 0}
                  sx={{ fontWeight: 700 }}
                >
                  {mutation.isPending ? 'Saving…' : employee ? 'Update Employee' : 'Create Employee'}
                </Button>
              </Box>
            </DialogActions>
          </Box>
        </>
      )}
    </Dialog>
  )
}

/** Rich Preview Dialog displaying all employee details */
export function EmployeePreviewDialog({
  employee,
  open,
  onClose,
  onEdit,
}: {
  employee: Employee | null
  open: boolean
  onClose: () => void
  onEdit: (emp: Employee) => void
}) {
  if (!employee) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 1.5, sm: 2 },
          width: { xs: 'calc(100% - 24px)', sm: 'auto' },
          maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
          borderRadius: { xs: 2.5, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 }, bgcolor: '#deeee5', color: '#176b5b', fontSize: { xs: 17, sm: 20 }, fontWeight: 700 }}>
            {`${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#173c35', lineHeight: 1.2, fontSize: { xs: 17, sm: 20 } }} noWrap>
                {employee.firstName} {employee.lastName}
              </Typography>
              <Chip size="small" label={`#${employee.id}`} sx={{ bgcolor: '#edf4f0', color: '#173c35', fontWeight: 600, height: 22 }} />
            </Box>
            <Typography variant="body2" sx={{ color: '#667873', mt: 0.25, fontSize: { xs: 12, sm: 13 } }} noWrap>
              {employee.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <Divider sx={{ flexShrink: 0 }} />

      <DialogContent sx={{ display: 'grid', gap: 2, py: 2, px: { xs: 2, sm: 3 }, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Employment Box */}
        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f7faf8', borderRadius: 2, border: '1px solid #e2ebe5' }}>
          <Typography variant="caption" sx={{ color: '#173c35', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            Employment Information
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ApartmentOutlined sx={{ fontSize: 18, color: '#176b5b' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#71817b', display: 'block' }}>Department</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.department?.name ?? 'Unassigned'}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoneyOutlined sx={{ fontSize: 18, color: '#176b5b' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#71817b', display: 'block' }}>Annual Salary</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {Number(employee.salary ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeOutlined sx={{ fontSize: 18, color: '#176b5b' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#71817b', display: 'block' }}>Portal Account</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {employee.username || employee.email}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Personal & Contact Box */}
        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f7faf8', borderRadius: 2, border: '1px solid #e2ebe5' }}>
          <Typography variant="caption" sx={{ color: '#173c35', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            Personal & Contact Details
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneOutlined sx={{ fontSize: 18, color: '#176b5b' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#71817b', display: 'block' }}>Phone</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.profile?.phone || 'Not provided'}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CakeOutlined sx={{ fontSize: 18, color: '#176b5b' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#71817b', display: 'block' }}>Date of Birth</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.profile?.dateOfBirth || 'Not provided'}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <HomeOutlined sx={{ fontSize: 18, color: '#176b5b', mt: 0.2 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#71817b', display: 'block' }}>Residential Address</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.profile?.address || 'Not provided'}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          justifyContent: 'space-between',
          gap: 1,
          '& > *': { width: { xs: '100%', sm: 'auto' } },
          flexShrink: 0,
        }}
      >
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<EditOutlined />}
          onClick={() => {
            onClose()
            onEdit(employee)
          }}
          sx={{ fontWeight: 700 }}
        >
          Edit Employee
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const departmentSchema = z.object({ name: z.string().trim().min(2).max(100), location: z.string().trim().min(1).max(200) })
type DepartmentValues = z.infer<typeof departmentSchema>

export function DepartmentDialog({ open, department, saving, error, onClose, onSave }: { open: boolean; department: Department | null; saving: boolean; error: unknown; onClose: () => void; onSave: (values: DepartmentValues & { id?: number }) => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepartmentValues>({ resolver: zodResolver(departmentSchema) })
  useEffect(() => {
    if (open) reset({ name: department?.name ?? '', location: department?.location ?? '' })
  }, [department, open, reset])
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{department ? 'Edit department' : 'Add department'}</DialogTitle>
      <form onSubmit={handleSubmit((values) => onSave({ ...values, ...(department ? { id: department.id } : {}) }))}>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
          {Boolean(error) && <Alert severity="error">{apiMessage(error)}</Alert>}
          <TextField label="Department name" {...register('name')} error={Boolean(errors.name)} helperText={errors.name?.message} />
          <TextField label="Location" {...register('location')} error={Boolean(errors.location)} helperText={errors.location?.message} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Save department'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

const profileSchema = z.object({
  phone: z.string().trim().regex(/^$|^[+]?[0-9]{7,15}$/, 'Use 7–15 digits, optionally starting with +'),
  address: z.string().max(300),
  dateOfBirth: z.string().refine((date) => !date || new Date(date) < new Date(), 'Date must be in the past'),
})
type ProfileValues = z.infer<typeof profileSchema>

export function ProfileDialog({ employee, isAdmin, onClose, onSaved }: { employee: Employee | null; isAdmin: boolean; onClose: () => void; onSaved: () => void }) {
  const open = Boolean(employee)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) })
  const mutation = useMutation({
    mutationFn: (values: ProfileValues) => upsertEmployeeProfile(employee!.id, {
      phone: values.phone || undefined, address: values.address || undefined, dateOfBirth: values.dateOfBirth || undefined,
    }),
    onSuccess: onSaved,
  })
  useEffect(() => {
    if (employee) reset({ phone: employee.profile?.phone ?? '', address: employee.profile?.address ?? '', dateOfBirth: employee.profile?.dateOfBirth ?? '' })
  }, [employee, reset])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{employee?.firstName} {employee?.lastName} <span style={{ color: '#71817b', fontSize: 14, fontWeight: 400 }}> / Profile</span></DialogTitle>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
          {mutation.isError && <Alert severity="error">{apiMessage(mutation.error)}</Alert>}
          {mutation.isSuccess && <Alert severity="success">Profile saved.</Alert>}
          <div className="profile-grid">
            <TextField label="Phone" disabled={!isAdmin} {...register('phone')} error={Boolean(errors.phone)} helperText={errors.phone?.message} />
            <TextField label="Date of birth" type="date" disabled={!isAdmin} InputLabelProps={{ shrink: true }} {...register('dateOfBirth')} error={Boolean(errors.dateOfBirth)} helperText={errors.dateOfBirth?.message} />
          </div>
          <TextField label="Address" disabled={!isAdmin} multiline minRows={3} {...register('address')} error={Boolean(errors.address)} helperText={errors.address?.message} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Close</Button>
          {isAdmin && <Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save profile'}</Button>}
        </DialogActions>
      </form>
    </Dialog>
  )
}