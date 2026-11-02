export type Session = { token: string; username: string; roles: string[] }

const tokenKey = 'workforce.token'
const usernameKey = 'workforce.username'

function getTokenRoles(token: string): string[] {
  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return []
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      roles?: string[]
      role?: string
      authorities?: string[]
      realm_access?: { roles?: string[] }
    }
    return [
      ...(payload.roles ?? []),
      ...(payload.authorities ?? []),
      ...(payload.realm_access?.roles ?? []),
      ...(payload.role ? [payload.role] : []),
    ].map((role) => role.replace(/^ROLE_/, '').toUpperCase())
  } catch {
    return []
  }
}

export function saveSession(token: string, username: string): Session {
  localStorage.setItem(tokenKey, token)
  localStorage.setItem(usernameKey, username)
  const roles = getTokenRoles(token)
  // The current sample backend issues subject-only JWTs; keep its seeded admin usable.
  if (!roles.length && username.toLowerCase() === 'admin') roles.push('ADMIN')
  return { token, username, roles }
}

export function restoreSession(): Session | null {
  const token = localStorage.getItem(tokenKey)
  const username = localStorage.getItem(usernameKey)
  if (!token || !username) return null
  const roles = getTokenRoles(token)
  if (!roles.length && username.toLowerCase() === 'admin') roles.push('ADMIN')
  return { token, username, roles }
}

export function clearSession() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(usernameKey)
}