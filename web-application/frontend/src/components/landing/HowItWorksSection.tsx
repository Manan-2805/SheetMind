import { useEffect, useRef, useState } from 'react'

import { motion } from 'framer-motion'

import SectionBadge from '@/components/common/SectionBadge'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const steps = [
  {
    number: 1,
    title: 'Upload your files',
    description: 'Drag and drop any .xlsx or .xls file into Data Sources. SheetMind imports it into a local DuckDB database in seconds.',
  },
  {
    number: 2,
    title: 'Ask in plain English',
    description: 'Type your question in the chat. Use # to reference specific files and sheets. SheetMind generates and executes the SQL automatically.',
  },
  {
    number: 3,
    title: 'Get instant answers',
    description: 'Results appear as sortable tables with charts, export options, and an AI-written summary. Save any query for reuse.',
  },
]

function ConnectorLine({ animate }: { animate: boolean }) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (pathRef.current && animate) {
      const length = pathRef.current.getTotalLength()
      pathRef.current.style.strokeDasharray = `${length}`
      pathRef.current.style.strokeDashoffset = `${length}`
      pathRef.current.style.transition = 'stroke-dashoffset 600ms ease-in-out'
      requestAnimationFrame(() => {
        if (pathRef.current) {
          pathRef.current.style.strokeDashoffset = '0'
        }
      })
    }
  }, [animate])

  return (
    <svg className="hidden flex-1 md:block" height="4" style={{ minWidth: 40 }}>
      <path
        ref={pathRef}
        d="M 0 2 L 200 2"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        style={{ strokeDashoffset: animate ? undefined : '200' }}
      />
    </svg>
  )
}

export default function HowItWorksSection() {
  const { ref, isVisible } = useScrollReveal()
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setAnimate(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  return (
    <section className="py-[120px] px-6" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
      <div ref={ref} className="mx-auto max-w-5xl">
        <motion.div
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <SectionBadge text="HOW IT WORKS" />
          <h2
            className="mt-6 text-3xl font-bold md:text-5xl"
            style={{ color: 'var(--color-text-primary)' }}
          >
            From file to insight in three steps
          </h2>
        </motion.div>

        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-0">
          {steps.map((step, i) => (
            <div key={step.number} className="contents">
              <motion.div
                className="flex flex-col items-center text-center md:flex-1"
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.2 }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {step.number}
                </div>
                <h3
                  className="mt-4 text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-2 max-w-[240px] text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {step.description}
                </p>
              </motion.div>
              {i < steps.length - 1 && <ConnectorLine animate={animate} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
