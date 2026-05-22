import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'

import { Menu, Search, X } from 'lucide-react'

import DocsSidebar from '@/components/docs/DocsSidebar'

export default function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <div
        className="sticky top-0 z-40 flex h-12 items-center justify-between px-4"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: 'var(--color-text-primary)' }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-4 w-4 rounded" style={{ backgroundColor: 'var(--color-primary)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              SheetMind
            </span>
          </Link>
        </div>

        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md max-w-[260px] flex-1 mx-8"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Search size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="text-xs flex-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Search docs...
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            Cmd+K
          </span>
        </div>

        <Link
          to="/"
          className="text-xs transition-colors duration-200"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Back to App
        </Link>
      </div>

      <div className="flex">
        <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-12 h-[calc(100vh-48px)] overflow-y-auto">
          <DocsSidebar />
        </aside>

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-12 z-30 w-[280px] h-[calc(100vh-48px)] overflow-y-auto lg:hidden">
              <DocsSidebar onClose={() => setSidebarOpen(false)} />
            </aside>
          </>
        )}

        <main className="flex-1 min-w-0 px-6 py-12 md:px-16 lg:max-w-[860px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
