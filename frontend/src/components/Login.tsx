import { useState, useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  TextField,
  Typography,
} from '@mui/material'
import MarkEmailReadOutlined from '@mui/icons-material/MarkEmailReadOutlined'
import LockResetOutlined from '@mui/icons-material/LockResetOutlined'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { useForm } from 'react-hook-form'
import { apiMessage } from '../error'
import { forgotPassword, resetPassword } from '../api/auth'

type LoginValues = { username: string; password: string }

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<void>
}

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState<1 | 2>(1)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Check if session expired
  const isSessionExpired = useMemo(() => {
    return new URLSearchParams(window.location.search).get('expired') === '1'
  }, [])

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>()

  async function submitLogin(values: LoginValues) {
    setError('')
    setSuccess('')
    setPending(true)
    try {
      await onLogin(values.username, values.password)
    } catch (reason) {
      setError(apiMessage(reason))
    } finally {
      setPending(false)
    }
  }

  // Request reset code sent to personal email
  async function handleSendResetCode(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('Please enter a valid personal email address')
      return
    }
    setError('')
    setPending(true)
    try {
      const res = await forgotPassword({ email: forgotEmail })
      setSuccess(res.message)
      if (res.verificationCode) {
        setDemoCode(res.verificationCode)
        setForgotCode(res.verificationCode)
      }
      setForgotStep(2)
    } catch (reason) {
      setError(apiMessage(reason))
    } finally {
      setPending(false)
    }
  }

  // Submit code and new password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotCode.trim()) {
      setError('Please enter the 6-digit verification code received on your mail')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setPending(true)
    try {
      const res = await resetPassword({
        email: forgotEmail,
        code: forgotCode,
        newPassword,
      })
      setSuccess(res.message)
      setMode('signin')
      setForgotStep(1)
      setForgotCode('')
      setNewPassword('')
      setConfirmPassword('')
      setLoginValue('username', forgotEmail)
    } catch (reason) {
      setError(apiMessage(reason))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login-wrap">
      <aside className="login-aside">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <div className="brand-name">People / Workforce</div>
            <div className="brand-caption">Employee operations & payroll</div>
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ color: '#d2a274' }}>Unified workforce platform</div>
          <h1>Teams are made of people.</h1>
          <p>
            Attendance tracking, leave requests, salary allowances, payroll billing, and performance reports — all in one unified portal.
          </p>
        </div>
        <div style={{ color: '#a9beb6', fontSize: 12 }}>
          Workforce management · Single Sign-On · Secure RBAC
        </div>
      </aside>

      <section className="login-form-wrap">
        <div className="login-panel" style={{ maxWidth: 440 }}>
          {isSessionExpired && mode === 'signin' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Your previous session expired for security. Please sign in again.
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {mode === 'signin' && (
            <>
              <div className="eyebrow">Enterprise Sign In</div>
              <h2>Sign in</h2>
              <p>Sign in using the credentials dispatched to your email address by your administrator.</p>

              <form onSubmit={handleLoginSubmit(submitLogin)}>
                <TextField
                  label="Username or Email"
                  autoComplete="username"
                  autoFocus
                  fullWidth
                  {...registerLogin('username', { required: 'Enter your username or email' })}
                  error={Boolean(loginErrors.username)}
                  helperText={loginErrors.username?.message}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  fullWidth
                  {...registerLogin('password', { required: 'Enter your password' })}
                  error={Boolean(loginErrors.password)}
                  helperText={loginErrors.password?.message}
                  sx={{ mb: 1 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Link
                    component="button"
                    type="button"
                    variant="caption"
                    onClick={() => {
                      setMode('forgot')
                      setError('')
                      setSuccess('')
                      setForgotStep(1)
                    }}
                    sx={{ color: '#173c35', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={pending}
                  sx={{ py: 1.3, fontWeight: 700 }}
                >
                  {pending ? 'Signing in…' : 'Continue to Dashboard'}
                </Button>
              </form>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#f4fbf7', borderRadius: 2, border: '1px solid #d8ece2' }}>
                <Typography variant="caption" sx={{ color: '#173c35', display: 'block', fontWeight: 700 }}>
                  Pre-configured system accounts:
                </Typography>
                <Typography variant="caption" sx={{ color: '#0e4a3b', display: 'block', mt: 0.5, fontWeight: 600 }}>
                  👑 Super Admin: <strong>superadmin</strong> / <code>superadmin123</code>
                </Typography>
                <Typography variant="caption" sx={{ color: '#4a6b63', display: 'block' }}>
                  ⚙️ Admin: <strong>admin</strong> / <code>admin123</code>
                </Typography>
                <Typography variant="caption" sx={{ color: '#4a6b63', display: 'block' }}>
                  👤 Standard Employee: <strong>user</strong> / <code>user123</code> (or provisioned credentials)
                </Typography>
                <Typography variant="caption" sx={{ color: '#2e5b4f', display: 'block', mt: 1, fontStyle: 'italic' }}>
                  ℹ️ Self-registration is disabled. All employees and administrators are created by the Super Admin / Admin with credentials sent directly to their email.
                </Typography>
              </Box>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <Button
                variant="text"
                size="small"
                startIcon={<ArrowBackRounded />}
                onClick={() => {
                  setMode('signin')
                  setError('')
                  setSuccess('')
                }}
                sx={{ mb: 2, color: '#173c35', textTransform: 'none', px: 0 }}
              >
                Back to Sign in
              </Button>

              <div className="eyebrow">Account Recovery</div>
              <h2>Reset Password</h2>
              <p>
                {forgotStep === 1
                  ? 'Enter your registered personal email address. A verification message with a secure code will be dispatched to your personal mail.'
                  : `Enter the 6-digit verification code sent to ${forgotEmail} along with your new password.`}
              </p>

              {forgotStep === 1 ? (
                <form onSubmit={handleSendResetCode}>
                  <TextField
                    label="Personal / Work Email"
                    type="email"
                    fullWidth
                    autoFocus
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    sx={{ mb: 2.5 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<MarkEmailReadOutlined />}
                    disabled={pending}
                    sx={{ py: 1.3, fontWeight: 700 }}
                  >
                    {pending ? 'Dispatching Email…' : 'Send Reset Code to Mail'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword}>
                  {demoCode && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#eef8f3', borderRadius: 2, border: '1px solid #c8e6d7' }}>
                      <Typography variant="caption" sx={{ color: '#173c35', display: 'block', fontWeight: 600 }}>
                        Message Dispatched to: {forgotEmail}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#4a6b63' }}>
                          Verification Code:
                        </Typography>
                        <Chip
                          size="small"
                          label={demoCode}
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Box>
                  )}

                  <TextField
                    label="6-Digit Verification Code"
                    fullWidth
                    autoFocus
                    required
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="Enter code from email"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="New Password"
                    type="password"
                    fullWidth
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={{ mb: 2.5 }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<LockResetOutlined />}
                    disabled={pending}
                    sx={{ py: 1.3, fontWeight: 700 }}
                  >
                    {pending ? 'Updating Password…' : 'Reset Password & Sign In'}
                  </Button>

                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Link
                      component="button"
                      type="button"
                      variant="caption"
                      onClick={() => setForgotStep(1)}
                      sx={{ color: '#4a6b63' }}
                    >
                      Didn&apos;t receive the email? Send code again
                    </Link>
                  </Box>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}