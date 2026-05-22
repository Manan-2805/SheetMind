import { Link } from 'react-router-dom'

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <div className="flex flex-col items-center text-center">
        <h1
          className="text-[120px] font-black leading-none"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          500
        </h1>
        <h2 className="mt-4 text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Something went wrong on our end
        </h2>
        <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
          We encountered an unexpected error. Please try again.
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md px-5 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Try Again
          </button>
          <Link
            to="/"
            className="rounded-md px-5 py-2.5 text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
