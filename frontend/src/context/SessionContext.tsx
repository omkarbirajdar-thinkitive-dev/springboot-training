import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clearSession, restoreSession, saveSession, type Session } from '../auth'
import { login as apiLogin } from '../api/generated'

import { registerUser as apiRegister, type RegisterPayload } from '../api/auth'

interface SessionContextType {
  session: Session | null
  isAdmin: boolean
  isSuperAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const SessionContext = createContext<SessionContextType | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => restoreSession())
  const queryClient = useQueryClient()
  const isSuperAdmin = session?.roles.includes('SUPER_ADMIN') || session?.username.toLowerCase() === 'superadmin'
  const isAdmin = isSuperAdmin || (session?.roles.includes('ADMIN') ?? false)

  async function login(username: string, password: string) {
    const result = await apiLogin({ username, password })
    if (!result.token) throw new Error('The API did not return an access token.')
    setSession(saveSession(result.token, username))
  }

  async function register(payload: RegisterPayload) {
    const result = await apiRegister(payload)
    if (!result.token) throw new Error('Registration succeeded but no access token was returned.')
    setSession(saveSession(result.token, payload.username))
  }

  function logout() {
    clearSession()
    setSession(null)
    queryClient.clear()
  }

  return (
    <SessionContext.Provider value={{ session, isAdmin, isSuperAdmin, login, register, logout }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextType {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
