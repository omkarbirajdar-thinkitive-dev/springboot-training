import { useState } from 'react'
import { Box, Typography, type SxProps } from '@mui/material'
import { MobileDrawer, MobileTopBar, Sidebar, SIDEBAR_WIDTH } from './Sidebar'
import { Outlet } from 'react-router-dom'

/** The root authenticated layout: sidebar left + scrollable main content right */
export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        bgcolor: 'transparent',
      }}
    >
      {/* Desktop permanent sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: SIDEBAR_WIDTH },
          flexShrink: { md: 0 },
          display: { xs: 'none', md: 'block' },
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Sidebar />
      </Box>

      {/* Mobile slide-out drawer */}
      <MobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Right content area: exactly fits viewport without window scrollbars */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          height: '100%',
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Mobile topbar with hamburger toggle */}
        <MobileTopBar onMenuClick={() => setMobileNavOpen(true)} />

        {/* Content container: fills remaining height */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            maxWidth: 1240,
            mx: 'auto',
            p: { xs: '10px 10px 12px', sm: '14px 16px 16px', md: '18px 24px 20px' },
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

/** Re-usable responsive compact page heading */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        justifyContent: 'space-between',
        gap: { xs: 1, sm: 1.5 },
        mb: { xs: 1, sm: 1.25, md: 1.5 },
        flexShrink: 0,
      }}
    >
      <Box sx={{ maxWidth: '100%' }}>
        {eyebrow && (
          <Box
            sx={{
              color: '#b45a3b',
              fontSize: { xs: 9.5, sm: 10.5 },
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              mb: 0.25,
            }}
          >
            {eyebrow}
          </Box>
        )}
        <Box
          component="h1"
          sx={{
            m: 0,
            color: '#173c35',
            fontFamily: 'Georgia, serif',
            fontSize: { xs: 20, sm: 26, md: 30 },
            fontWeight: 500,
            lineHeight: 1.15,
          }}
        >
          {title}
        </Box>
        {subtitle && (
          <Box sx={{ mt: 0.25, color: '#667873', fontSize: { xs: 11.5, sm: 13 } }}>
            {subtitle}
          </Box>
        )}
      </Box>
      {action && (
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
            display: 'flex',
            gap: 1,
            '& > *': { width: { xs: 'auto', sm: 'auto' } },
          }}
        >
          {action}
        </Box>
      )}
    </Box>
  )
}

/** Compact metric card used on dashboards & directories */
export function StatCard({
  label,
  value,
  icon,
  color = '#176b5b',
  sx,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: string
  sx?: SxProps
}) {
  return (
    <Box
      sx={{
        p: { xs: '6px 10px', sm: '10px 14px', md: '12px 16px' },
        border: '1px solid #dfe8e1',
        borderRadius: 1.5,
        bgcolor: 'rgba(255,255,255,.9)',
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.5 },
        minWidth: 0,
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            color,
            opacity: 0.85,
            display: 'flex',
            alignItems: 'center',
            '& svg': { fontSize: { xs: 20, sm: 24, md: 28 } },
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ color: '#71817b', fontSize: { xs: 10, sm: 11 }, mb: 0.1 }} noWrap>
          {label}
        </Typography>
        <Box
          sx={{
            color: '#173c35',
            fontFamily: 'Georgia, serif',
            fontSize: { xs: 16, sm: 20, md: 22 },
            lineHeight: 1.1,
          }}
        >
          {value}
        </Box>
      </Box>
    </Box>
  )
}

/** Simple content card wrapper that flexes properly */
export function ContentCard({ children, sx }: { children: React.ReactNode; sx?: SxProps }) {
  return (
    <Box
      sx={{
        border: '1px solid #dfe8e1',
        borderRadius: 2,
        bgcolor: '#fff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

/** Section chip / badge */
export function StatusChip({ label, color }: { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }) {
  const palette: Record<string, { bg: string; text: string }> = {
    success: { bg: '#e8f5e9', text: '#2e7d32' },
    warning: { bg: '#fff3e0', text: '#e65100' },
    error:   { bg: '#fce4ec', text: '#c62828' },
    info:    { bg: '#e3f2fd', text: '#1565c0' },
    default: { bg: '#f1f5f2', text: '#546e7a' },
  }
  const { bg, text } = palette[color] ?? palette.default
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center',
      px: 1, py: 0.25, borderRadius: '12px',
      bgcolor: bg, color: text,
      fontSize: 12, fontWeight: 700, lineHeight: 1.8,
    }}>
      {label}
    </Box>
  )
}
