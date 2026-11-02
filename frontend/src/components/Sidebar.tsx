import { NavLink, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'

// Icons
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined'
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import BeachAccessOutlined from '@mui/icons-material/BeachAccessOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import MenuRounded from '@mui/icons-material/MenuRounded'
import MonetizationOnOutlined from '@mui/icons-material/MonetizationOnOutlined'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined'

import { useSession } from '../context/SessionContext'

export const SIDEBAR_WIDTH = 240

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  adminOnly?: boolean
  employeeOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  // Common
  { label: 'Dashboard',     to: '/',                  icon: <DashboardOutlined /> },
  // Admin sections
  { label: 'Employees',     to: '/employees',          icon: <BadgeOutlined />,             adminOnly: true },
  { label: 'Departments',   to: '/departments',        icon: <ApartmentOutlined />,          adminOnly: true },
  { label: 'Attendance',    to: '/admin/attendance',   icon: <CalendarMonthOutlined />,      adminOnly: true },
  { label: 'Leaves',        to: '/admin/leaves',       icon: <BeachAccessOutlined />,        adminOnly: true },
  { label: 'Allowances',    to: '/admin/allowances',   icon: <MonetizationOnOutlined />,     adminOnly: true },
  { label: 'Payroll',       to: '/admin/payroll',      icon: <ReceiptLongOutlined />,        adminOnly: true },
  { label: 'Reports',       to: '/admin/reports',      icon: <AssessmentOutlined />,         adminOnly: true },
  // Employee sections
  { label: 'My Attendance', to: '/attendance',         icon: <CalendarMonthOutlined />,      employeeOnly: true },
  { label: 'My Leaves',     to: '/leaves',             icon: <BeachAccessOutlined />,        employeeOnly: true },
  { label: 'My Payslips',   to: '/payslips',           icon: <ReceiptLongOutlined />,        employeeOnly: true },
  { label: 'My Allowances', to: '/allowances',         icon: <MonetizationOnOutlined />,     employeeOnly: true },
  // Common
  { label: 'My Profile',    to: '/profile',            icon: <PersonOutlineRounded /> },
]

/** Shared sidebar body used in both desktop permanent drawer and mobile temporary drawer */
export function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { session, isAdmin, logout } = useSession()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin
    if (item.employeeOnly) return !isAdmin
    return true
  })

  const mainItems = visibleItems.filter((i) => i.to !== '/profile' && i.to !== '/password')
  const accountItems = visibleItems.filter((i) => i.to === '/profile' || i.to === '/password')

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0e2f2a', color: '#d5e4de' }}>
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 34, height: 34, display: 'grid', placeItems: 'center',
          border: '1px solid rgba(255,255,255,.35)', borderRadius: '50%',
          color: '#d2a274', fontFamily: 'Georgia, serif', fontSize: 17, flexShrink: 0,
        }}>P</Box>
        <Box>
          <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#f0f6f3', lineHeight: 1.2 }}>
            People
          </Typography>
          <Typography sx={{ fontSize: 10, color: '#7da89c', letterSpacing: '1.1px', textTransform: 'uppercase' }}>
            Workforce
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,.08)', mb: 1 }} />

      {/* Role badge */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Chip
          label={isAdmin ? 'Administrator' : 'Employee'}
          size="small"
          sx={{
            bgcolor: isAdmin ? 'rgba(210,160,116,.18)' : 'rgba(125,168,156,.18)',
            color: isAdmin ? '#d2a274' : '#7da89c',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.8px',
            height: 22,
          }}
        />
      </Box>

      {/* Main navigation list */}
      <List dense sx={{ px: 1, flex: 1, overflowY: 'auto' }}>
        {mainItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === '/'}
            onClick={onItemClick}
            sx={{
              borderRadius: '6px',
              mb: 0.5,
              color: '#a8c4bc',
              '&:hover': { bgcolor: 'rgba(255,255,255,.07)', color: '#e8f4ef' },
              '&.active': { bgcolor: 'rgba(255,255,255,.12)', color: '#e8f4ef', '& .MuiListItemIcon-root': { color: '#7dd6be' } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit', transition: 'color .15s' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,.08)' }} />

      {/* Account items */}
      <List dense sx={{ px: 1, py: 0.5 }}>
        {accountItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={onItemClick}
            sx={{
              borderRadius: '6px',
              mb: 0.5,
              color: '#a8c4bc',
              '&:hover': { bgcolor: 'rgba(255,255,255,.07)', color: '#e8f4ef' },
              '&.active': { bgcolor: 'rgba(255,255,255,.12)', color: '#e8f4ef' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,.08)' }} />

      {/* User footer */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#d2a274', color: '#0e2f2a', fontSize: 13, fontWeight: 700 }}>
          {session?.username.slice(0, 1).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 650, color: '#e8f4ef', lineHeight: 1.2 }} noWrap>
            {session?.username}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#7da89c' }}>Signed in</Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton size="small" onClick={handleLogout} sx={{ color: '#7da89c', '&:hover': { color: '#f0f6f3' } }}>
            <LogoutRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

/** Desktop Permanent Sidebar */
export function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          borderRight: 'none',
        },
      }}
    >
      <SidebarContent />
    </Drawer>
  )
}

/** Mobile Temporary Drawer */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          bgcolor: '#0e2f2a',
          borderRight: 'none',
        },
      }}
    >
      <SidebarContent onItemClick={onClose} />
    </Drawer>
  )
}

/** Mobile TopBar with Hamburger menu toggle */
export function MobileTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { session, logout } = useSession()
  const navigate = useNavigate()
  return (
    <Box sx={{
      display: { xs: 'flex', md: 'none' },
      alignItems: 'center', justifyContent: 'space-between',
      px: 1.5, py: 1.2, bgcolor: '#0e2f2a', color: '#f0f6f3',
      position: 'sticky', top: 0, zIndex: 1100,
      borderBottom: '1px solid rgba(255,255,255,.08)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton size="small" onClick={onMenuClick} sx={{ color: '#f0f6f3', p: 0.75 }}>
          <MenuRounded />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <SpaceDashboardOutlined sx={{ fontSize: 20, color: '#d2a274' }} />
          <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 600 }}>People</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 12, color: '#7da89c', maxWidth: 100 }} noWrap>
          {session?.username}
        </Typography>
        <Tooltip title="Sign out">
          <IconButton size="small" onClick={() => { logout(); navigate('/login', { replace: true }) }} sx={{ color: '#7da89c' }}>
            <LogoutRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
