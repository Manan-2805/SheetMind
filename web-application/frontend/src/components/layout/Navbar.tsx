import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isLanding = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleFeaturesClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLanding) {
        e.preventDefault()
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
      }
    },
    [isLanding]
  )

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(8, 8, 14, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded" style={{ backgroundColor: 'var(--color-primary)' }} />
          <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            SheetMind
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href={isLanding ? '#features' : '/#features'}
            onClick={handleFeaturesClick}
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            Features
          </a>
          <Link
            to="/docs"
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            Documentation
          </Link>
          <a
            href="#"
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200"
            style={{
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)'
              e.currentTarget.style.borderColor = 'var(--color-border-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            Login
          </Link>
          <Link
            to="/docs"
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
          >
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="flex flex-col gap-4 px-6 pb-6 md:hidden"
          style={{ backgroundColor: 'rgba(8, 8, 14, 0.95)', backdropFilter: 'blur(12px)' }}
        >
          <a
            href={isLanding ? '#features' : '/#features'}
            onClick={(e) => {
              handleFeaturesClick(e)
              setMobileOpen(false)
            }}
            className="text-sm py-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Features
          </a>
          <Link to="/docs" className="text-sm py-2" style={{ color: 'var(--color-text-secondary)' }} onClick={() => setMobileOpen(false)}>
            Documentation
          </Link>
          <a href="#" className="text-sm py-2" style={{ color: 'var(--color-text-secondary)' }}>
            GitHub
          </a>
          <div className="flex gap-3 pt-2">
            <Link
              to="/login"
              className="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium"
              style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/docs"
              className="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
