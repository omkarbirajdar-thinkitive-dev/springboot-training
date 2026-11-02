import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material'
import LockResetRounded from '@mui/icons-material/LockResetRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import SecurityRounded from '@mui/icons-material/SecurityRounded'

import { selfServiceApi } from '../api/selfService'
import { ContentCard, PageHeader } from '../components/Layout'
import { apiMessage } from '../error'

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: '', color: '#e0e0e0' }
  let score = 0
  if (pass.length >= 6) score += 25
  if (pass.length >= 10) score += 25
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 25

  if (score <= 25) return { score, label: 'Weak', color: '#b02a22' }
  if (score <= 50) return { score, label: 'Fair', color: '#b46d00' }
  if (score <= 75) return { score, label: 'Good', color: '#176b5b' }
  return { score: 100, label: 'Strong', color: '#0e704a' }
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const strength = calculatePasswordStrength(newPassword)

  const changeMutation = useMutation({
    mutationFn: () => {
      if (!currentPassword) {
        throw new Error('Please enter your current password')
      }
      if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long')
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirmation do not match')
      }
      return selfServiceApi.changePassword({
        currentPassword,
        newPassword,
      })
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message || 'Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrorMsg('')
    },
    onError: (err: unknown) => {
      setErrorMsg(apiMessage(err))
      setSuccessMsg('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    changeMutation.mutate()
  }

  return (
    <Box>
      <PageHeader
        eyebrow="Security & Authentication"
        title="Change Password"
        subtitle="Update your system password securely to keep your account protected."
      />

      <Box sx={{ maxWidth: 540 }}>
        <ContentCard>
          <Box sx={{ p: '16px 20px', borderBottom: '1px solid #e6ece7', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityRounded sx={{ color: '#176b5b' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Password Security
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                Must be at least 6 characters long
              </Typography>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {successMsg && (
              <Alert severity="success" icon={<CheckCircleRounded />}>
                {successMsg}
              </Alert>
            )}

            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <TextField
              fullWidth
              type="password"
              label="Current Password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />

            <Box>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                placeholder="Enter a secure new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              {newPassword && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Password Strength:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: strength.color }}>
                      {strength.label}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={strength.score}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#e5e7eb',
                      '& .MuiLinearProgress-bar': { bgcolor: strength.color },
                    }}
                  />
                </Box>
              )}
            </Box>

            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              placeholder="Re-type your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            <Box sx={{ pt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<LockResetRounded />}
                disabled={changeMutation.isPending}
              >
                {changeMutation.isPending ? 'Verifying...' : 'Update Password'}
              </Button>
            </Box>
          </Box>
        </ContentCard>
      </Box>
    </Box>
  )
}
