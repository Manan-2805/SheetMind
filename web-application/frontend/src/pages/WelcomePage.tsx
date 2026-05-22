import { Link } from 'react-router-dom'

import { motion } from 'framer-motion'
import { BookOpen, Download } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

export default function WelcomePage() {
  const { user, logout } = useAuth()

  if (!user) return null

  const initials = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg-base)' }}
    >
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="h-20 w-20 rounded-full object-cover"
            style={{ boxShadow: '0 0 0 3px var(--color-primary)' }}
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
            style={{
              backgroundColor: 'var(--color-primary)',
              boxShadow: '0 0 0 3px var(--color-primary)',
            }}
          >
            {initials}
          </div>
        )}

        <p className="mt-6 text-base" style={{ color: 'var(--color-text-secondary)' }}>
          Welcome back,
        </p>
        <h1
          className="text-3xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {user.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          {user.email}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-5">
          <div
            className="w-[280px] p-6 flex flex-col items-center text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Download size={32} style={{ color: 'var(--color-primary-light)' }} />
            <h3
              className="mt-4 text-base font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Download SheetMind
            </h3>
            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              The desktop application is coming soon. We'll notify you when it's available.
            </p>
            <div className="relative group w-full mt-4">
              <button
                className="w-full rounded-md py-2.5 text-sm font-medium cursor-not-allowed opacity-60"
                style={{
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
                disabled
              >
                Notify Me
              </button>
              <div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Coming Soon
              </div>
            </div>
          </div>

          <div
            className="w-[280px] p-6 flex flex-col items-center text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <BookOpen size={32} style={{ color: 'var(--color-primary-light)' }} />
            <h3
              className="mt-4 text-base font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Read the Docs
            </h3>
            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Learn how to use every feature of SheetMind with step-by-step guides.
            </p>
            <Link
              to="/docs"
              className="w-full mt-4 rounded-md py-2.5 text-sm font-medium text-white text-center transition-colors duration-200 block"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Open Documentation &rarr;
            </Link>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-8 text-sm transition-colors duration-200"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Sign out
        </button>
      </motion.div>
    </div>
  )
}
