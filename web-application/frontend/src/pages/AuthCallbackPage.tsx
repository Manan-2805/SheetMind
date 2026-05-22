import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { AlertCircle, Loader2 } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'Security check failed. Please try logging in again.',
  token_exchange_failed: 'Could not complete Google sign-in. Please try again.',
  user_creation_failed: 'Could not create your account. Please contact support.',
}

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const status = searchParams.get('status')
  const reason = searchParams.get('reason')

  useEffect(() => {
    if (status === 'success') {
      refreshUser().then(() => {
        navigate('/welcome', { replace: true })
      }).catch(() => {
        navigate('/login?error=session_failed', { replace: true })
      })
    } else if (status === 'error') {
      setError(
        reason
          ? ERROR_MESSAGES[reason] || 'An unexpected error occurred. Please try again.'
          : 'An unexpected error occurred. Please try again.'
      )
    }
  }, [status, reason, navigate, refreshUser])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <div
          className="w-full max-w-[400px] p-10 flex flex-col items-center text-center"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
          >
            <AlertCircle size={24} style={{ color: 'var(--color-error)' }} />
          </div>
          <h1
            className="mt-4 text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Sign-in failed
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {error}
          </p>
          <Link
            to="/login"
            className="mt-6 rounded-md px-5 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Try again
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <Loader2
        size={32}
        className="animate-spin"
        style={{ color: 'var(--color-primary)' }}
      />
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Completing sign in...
      </p>
    </div>
  )
}
