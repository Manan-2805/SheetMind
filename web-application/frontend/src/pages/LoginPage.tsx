import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import ParticleBackground from '@/components/landing/ParticleBackground'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/welcome', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleGoogleLogin = async () => {
    setIsConnecting(true)
    try {
      const response = await api.get('/auth/google')
      if (response.data?.success && response.data?.data?.auth_url) {
        window.location.href = response.data.data.auth_url
      }
    } catch {
      setIsConnecting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <ParticleBackground />

      <motion.div
        className="relative z-10 w-full max-w-[400px] mx-4 p-12"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
        }}
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }} />
            <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              SheetMind
            </span>
          </div>

          <h1
            className="mt-8 text-2xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Welcome back
          </h1>
          <p
            className="mt-2 text-sm text-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Sign in to access your SheetMind account and documentation.
          </p>

          <button
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-md h-11 text-sm font-medium transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            onClick={handleGoogleLogin}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 flex w-full items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>

          <p
            className="mt-6 text-xs text-center leading-relaxed"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            No account needed to use SheetMind desktop. Login is only required for cloud features.
          </p>

          <Link
            to="/"
            className="mt-8 text-sm transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            &larr; Back to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
