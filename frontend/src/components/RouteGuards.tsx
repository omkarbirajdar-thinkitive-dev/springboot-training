import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

/** Redirects to /login if not authenticated */
export function RequireAuth() {
  const { session } = useSession()
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Redirects to / if not ADMIN */
export function RequireAdmin() {
  const { isAdmin } = useSession()
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

/** Redirects logged-in users away from /login */
export function PublicOnly() {
  const { session } = useSession()
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}
