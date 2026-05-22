import { Link } from 'react-router-dom'

export default function NotFoundPage() {
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
          404
        </h1>
        <h2 className="mt-4 text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Page not found
        </h2>
        <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            to="/"
            className="rounded-md px-5 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Go Home
          </Link>
          <Link
            to="/docs"
            className="rounded-md px-5 py-2.5 text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            Read Docs
          </Link>
        </div>
      </div>
    </div>
  )
}
