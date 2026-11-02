import { Box, Typography } from '@mui/material'
import { PageHeader } from '../components/Layout'
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded'

interface ComingSoonProps {
  title: string
  eyebrow?: string
  description?: string
  phase?: string
}

export default function ComingSoon({ title, eyebrow, description, phase }: ComingSoonProps) {
  return (
    <Box>
      <PageHeader eyebrow={eyebrow ?? 'Feature'} title={title} subtitle={description} />
      <Box sx={{
        mt: 4, p: 6, border: '1px dashed #c8d8cf', borderRadius: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: 2,
      }}>
        <HourglassEmptyRounded sx={{ fontSize: 48, color: '#b0c4bc' }} />
        <Typography sx={{ fontSize: 18, fontFamily: 'Georgia, serif', color: '#173c35' }}>
          Coming soon
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#71817b', maxWidth: 400 }}>
          This feature is being built step-by-step.
          {phase && ` It will be ready in ${phase}.`}
        </Typography>
      </Box>
    </Box>
  )
}
