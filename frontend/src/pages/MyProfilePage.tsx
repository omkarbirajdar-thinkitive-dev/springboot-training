import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import SaveRounded from '@mui/icons-material/SaveRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import CorporateFareRounded from '@mui/icons-material/CorporateFareRounded'
import EmailOutlined from '@mui/icons-material/EmailOutlined'

import { selfServiceApi } from '../api/selfService'
import { ContentCard, PageHeader } from '../components/Layout'
import { apiMessage } from '../error'

export default function MyProfilePage() {
  const queryClient = useQueryClient()
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const profileQuery = useQuery({
    queryKey: ['employee', 'me'],
    queryFn: () => selfServiceApi.getMyProfile(),
  })

  const employee = profileQuery.data

  useEffect(() => {
    if (employee?.profile) {
      setPhone(employee.profile.phone || '')
      setAddress(employee.profile.address || '')
      setDateOfBirth(employee.profile.dateOfBirth || '')
    }
  }, [employee])

  const updateMutation = useMutation({
    mutationFn: () =>
      selfServiceApi.updateMyProfile({
        phone: phone || null,
        address: address || null,
        dateOfBirth: dateOfBirth || null,
      }),
    onSuccess: () => {
      setSuccessMsg('Your personal profile details have been successfully updated!')
      queryClient.invalidateQueries({ queryKey: ['employee', 'me'] })
    },
  })

  const initials = employee
    ? `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'

  return (
    <Box>
      <PageHeader
        eyebrow="Account & Preferences"
        title="My Profile"
        subtitle="Manage your personal contact information, home address, and view organization records."
      />

      {profileQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={30} />
        </Box>
      ) : profileQuery.isError ? (
        <Alert severity="error">{apiMessage(profileQuery.error)}</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Identity Header Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid #dfe6e2',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              background: 'linear-gradient(135deg, #f7faf8 0%, #eef5f1 100%)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: '#176b5b',
                  color: '#ffffff',
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#173c35' }}>
                  {employee?.firstName} {employee?.lastName}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5, color: 'text.secondary', fontSize: 13 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailOutlined fontSize="small" />
                    {employee?.email}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CorporateFareRounded fontSize="small" />
                    {employee?.department?.name || 'Unassigned Department'}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BadgeOutlined fontSize="small" />
                    ID #{employee?.id}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Edit Personal Information Card */}
          <ContentCard>
            <Box sx={{ p: '16px 20px', borderBottom: '1px solid #e6ece7' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Personal Contact & Demographics
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                Keep your home contact records current for HR communications and payroll vouchers
              </Typography>
            </Box>

            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {successMsg && (
                <Alert
                  severity="success"
                  icon={<CheckCircleRounded />}
                  onClose={() => setSuccessMsg('')}
                >
                  {successMsg}
                </Alert>
              )}

              {updateMutation.isError && (
                <Alert severity="error">{apiMessage(updateMutation.error)}</Alert>
              )}

              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date of Birth"
                    InputLabelProps={{ shrink: true }}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Residential Address"
                    placeholder="Street address, city, state, zip code..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveRounded />}
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </Box>
            </Box>
          </ContentCard>
        </Box>
      )}
    </Box>
  )
}
