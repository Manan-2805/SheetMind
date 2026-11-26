import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer
      className="px-6 py-12"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-5 w-5 rounded" style={{ backgroundColor: 'var(--color-primary)' }} />
            <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              SheetMind
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/docs"
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Documentation
            </Link>
            <a
              href="#"
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              GitHub Releases
            </a>
            <a
              href="#"
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Privacy
            </a>
          </div>

          <Link
            to="/download"
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Download
          </Link>
        </div>

        <div
          className="mt-8 flex flex-col gap-2 pt-6 md:flex-row md:items-center md:justify-between"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            &copy; 2026 SheetMind. All rights reserved.
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Built with React, FastAPI, and DuckDB.
          </span>
        </div>
      </div>
    </footer>
  );
}
