import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded'
import MarkEmailReadOutlined from '@mui/icons-material/MarkEmailReadOutlined'
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded'
import { createAdminAccount, type CreateAdminResponse } from '../api/auth'
import type { Department } from '../api/contracts'
import { apiMessage } from '../error'

interface CreateAdminDialogProps {
  open: boolean
  departments: Department[]
  onClose: () => void
  onSuccess: () => void
}

export function CreateAdminDialog({ open, departments, onClose, onSuccess }: CreateAdminDialogProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [customPassword, setCustomPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdAdmin, setCreatedAdmin] = useState<CreateAdminResponse | null>(null)
  const [copied, setCopied] = useState(false)

  function resetForm() {
    setFirstName('')
    setLastName('')
    setUsername('')
    setEmail('')
    setDepartmentId('')
    setCustomPassword('')
    setError('')
    setCreatedAdmin(null)
    setCopied(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName || !lastName || !username || !email) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await createAdminAccount({
        firstName,
        lastName,
        username,
        email,
        departmentId: departmentId ? Number(departmentId) : undefined,
        temporaryPassword: customPassword.trim() || undefined,
      })
      setCreatedAdmin(res)
      onSuccess()
    } catch (reason) {
      setError(apiMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  function copyCredentials() {
    if (!createdAdmin) return
    const text = `Workforce Administrator Credentials\nUsername: ${createdAdmin.username}\nPassword: ${createdAdmin.temporaryPassword}\nLogin: http://localhost:5173/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <AdminPanelSettingsRounded color="secondary" />
        Provision New Administrator
      </DialogTitle>

      <DialogContent sx={{ pt: 1, flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          As <strong>Super Admin</strong>, you have exclusive privilege to grant Administrator access.
          The account will be provisioned in Keycloak and credentials automatically dispatched to the admin's personal email.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {createdAdmin ? (
          <Box sx={{ mt: 1 }}>
            <Alert
              icon={<MarkEmailReadOutlined fontSize="inherit" />}
              severity="success"
              sx={{ mb: 2 }}
            >
              Administrator account provisioned! Credentials have been dispatched to <strong>{createdAdmin.email}</strong>.
            </Alert>

            <Box sx={{ p: 2.5, bgcolor: '#f4fbf7', borderRadius: 2, border: '1px solid #c8e6d7' }}>
              <Typography variant="subtitle2" sx={{ color: '#173c35', fontWeight: 700, mb: 1 }}>
                Generated Administrator Credentials:
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1, fontSize: 14 }}>
                <Typography variant="body2" color="text.secondary">Username:</Typography>
                <Typography variant="body2" fontWeight={600}><code>{createdAdmin.username}</code></Typography>

                <Typography variant="body2" color="text.secondary">Password:</Typography>
                <Typography variant="body2" fontWeight={600}><code>{createdAdmin.temporaryPassword}</code></Typography>

                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body2">{createdAdmin.email}</Typography>

                <Typography variant="body2" color="text.secondary">Assigned Role:</Typography>
                <Box><Chip size="small" label="ADMIN" color="primary" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} /></Box>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyRounded />}
                  onClick={copyCredentials}
                  sx={{ textTransform: 'none' }}
                >
                  {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
                </Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <form id="create-admin-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="First Name"
                  fullWidth
                  size="small"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Last Name"
                  fullWidth
                  size="small"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Grid>
            </Grid>

            <TextField
              label="Username"
              fullWidth
              size="small"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jessica_admin"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Personal / Work Email"
              type="email"
              fullWidth
              size="small"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jessica@example.com (credentials will be sent here)"
              helperText="Credentials and login link will be emailed to this address."
              sx={{ mb: 2 }}
            />

            <TextField
              select
              label="Department"
              fullWidth
              size="small"
              value={departmentId}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Default (Administration)</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Custom Password (Optional)"
              type="text"
              fullWidth
              size="small"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              placeholder="Leave blank to auto-generate a secure password"
              helperText="If blank, a secure random password (e.g. Admin@4812!) will be generated automatically."
            />
          </form>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 2.5 },
          display: 'flex',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: 1,
          '& > *': { width: { xs: '100%', sm: 'auto' } },
          flexShrink: 0,
        }}
      >
        {createdAdmin ? (
          <Button variant="contained" onClick={handleClose} fullWidth>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-admin-form"
              variant="contained"
              color="secondary"
              startIcon={<AdminPanelSettingsRounded />}
              disabled={loading}
              sx={{ fontWeight: 700 }}
            >
              {loading ? 'Creating…' : 'Create Admin'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
