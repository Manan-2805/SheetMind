import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowContent(true)
    }
  }, [isLoading])

  if (isLoading || !showContent) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
