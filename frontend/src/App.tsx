import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

import { SessionProvider, useSession } from './context/SessionContext'
import { RequireAuth, RequireAdmin, PublicOnly } from './components/RouteGuards'
import { AppLayout } from './components/Layout'
import { Login } from './components/Login'
import Dashboard from './pages/Dashboard'
import EmployeesPage from './pages/EmployeesPage'
import DepartmentsPage from './pages/DepartmentsPage'
import MyAttendancePage from './pages/MyAttendancePage'
import AdminAttendancePage from './pages/AdminAttendancePage'
import MyLeavesPage from './pages/MyLeavesPage'
import AdminLeavesPage from './pages/AdminLeavesPage'
import MyAllowancesPage from './pages/MyAllowancesPage'
import AdminAllowancesPage from './pages/AdminAllowancesPage'
import MyPayslipsPage from './pages/MyPayslipsPage'
import AdminPayrollPage from './pages/AdminPayrollPage'
import MyProfilePage from './pages/MyProfilePage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AdminReportsPage from './pages/AdminReportsPage'

import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false } },
})

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#176b5b', dark: '#123b35' },
    secondary: { main: '#c75a3a' },
    background: { default: '#f2f5f1', paper: '#ffffff' },
    text: { primary: '#19332e', secondary: '#667873' },
    error: { main: '#b23b32' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Segoe UI", sans-serif',
    h1: { fontFamily: 'Georgia, serif', fontWeight: 500 },
    h2: { fontFamily: 'Georgia, serif', fontWeight: 500 },
    h3: { fontFamily: 'Georgia, serif', fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 650 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 6, minHeight: 40 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-head': { fontWeight: 700, color: '#173c35' } },
      },
    },
  },
})

/** Login page — has access to SessionContext via useSession */
function LoginPage() {
  const { login } = useSession()
  const navigate = useNavigate()

  async function handleLogin(username: string, password: string) {
    await login(username, password)
    navigate('/', { replace: true })
  }

  return <Login onLogin={handleLogin} />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public — redirect away if already logged in */}
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Authenticated — all wrapped in sidebar layout */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Admin-only */}
          <Route element={<RequireAdmin />}>
            <Route path="/employees"        element={<EmployeesPage />} />
            <Route path="/departments"      element={<DepartmentsPage />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            <Route path="/admin/leaves"     element={<AdminLeavesPage />} />
            <Route path="/admin/allowances" element={<AdminAllowancesPage />} />
            <Route path="/admin/payroll"    element={<AdminPayrollPage />} />
            <Route path="/admin/reports"    element={<AdminReportsPage />} />
          </Route>

          {/* Employee self-service */}
          <Route path="/attendance" element={<MyAttendancePage />} />
          <Route path="/leaves"     element={<MyLeavesPage />} />
          <Route path="/payslips"   element={<MyPayslipsPage />} />
          <Route path="/allowances" element={<MyAllowancesPage />} />
          <Route path="/profile"    element={<MyProfilePage />} />
          <Route path="/password"   element={<ChangePasswordPage />} />

          {/* 404 inside app → back to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>

      {/* Any other path → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SessionProvider>
            <AppRoutes />
          </SessionProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}