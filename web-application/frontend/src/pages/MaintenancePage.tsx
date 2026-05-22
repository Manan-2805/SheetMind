import { Wrench } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <div className="flex flex-col items-center text-center">
        <Wrench
          size={64}
          className="animate-[spin_8s_linear_infinite]"
          style={{ color: 'var(--color-primary-light)' }}
        />
        <h1
          className="mt-8 text-3xl font-bold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          SheetMind is under maintenance
        </h1>
        <p
          className="mt-3 text-base"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          We're making improvements. We'll be back shortly.
        </p>
        <p
          className="mt-6 text-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Thank you for your patience.
        </p>
      </div>
    </div>
  )
}
