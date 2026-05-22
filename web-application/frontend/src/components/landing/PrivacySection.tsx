import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

import { useScrollReveal } from '@/hooks/useScrollReveal'

const stats = [
  { value: '0 bytes', label: 'sent to cloud' },
  { value: '100%', label: 'local processing' },
  { value: '0 trackers', label: 'no analytics' },
]

export default function PrivacySection() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section
      className="py-[120px] px-6 relative"
      style={{
        background: 'linear-gradient(to bottom, #0D0A1F, var(--color-bg-base))',
      }}
    >
      <div ref={ref} className="mx-auto max-w-3xl relative">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%)',
            filter: 'blur(60px)',
            zIndex: 0,
          }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center p-12 md:p-16"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Lock size={48} style={{ color: 'var(--color-primary-light)' }} />
          <h2
            className="mt-6 text-3xl font-bold md:text-[40px] md:leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Your data never leaves your machine
          </h2>
          <p
            className="mt-4 max-w-[520px] text-base leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            SheetMind is a local-first desktop application. Your Excel files, query history,
            and results are stored only on your computer. No telemetry. No cloud sync. No
            account required to run the app.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-6 w-full">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex-1 min-w-[140px] flex flex-col items-center p-6"
                style={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: 'var(--color-primary-light)' }}
                >
                  {stat.value}
                </span>
                <span
                  className="mt-1 text-xs"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
