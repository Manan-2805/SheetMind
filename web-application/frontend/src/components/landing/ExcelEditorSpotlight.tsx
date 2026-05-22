import { useCallback, useEffect, useRef, useState } from 'react'

import { motion } from 'framer-motion'
import { Check, Image as ImageIcon } from 'lucide-react'

import SectionBadge from '@/components/common/SectionBadge'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const features = [
  'Full cell formatting: bold, italic, colors, borders, alignment',
  'Freeze rows and columns for large datasets',
  'AI mutation panel: describe changes in plain English',
  'Diff preview before any change is applied',
  'Change stack: review, accept, or reject every AI suggestion',
  'Auto-backup before every save',
]

export default function ExcelEditorSpotlight() {
  const { ref, isVisible } = useScrollReveal()
  const mockupRef = useRef<HTMLDivElement>(null)
  const [parallaxY, setParallaxY] = useState(0)

  const handleScroll = useCallback(() => {
    if (mockupRef.current) {
      const rect = mockupRef.current.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const viewCenter = window.innerHeight / 2
      const offset = ((center - viewCenter) / window.innerHeight) * 20
      setParallaxY(-offset)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <section className="py-[120px] px-6" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <div ref={ref} className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: -40 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionBadge text="EXCEL EDITOR" />
            <h2
              className="mt-6 text-3xl font-bold md:text-[40px] md:leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Edit your spreadsheets with AI at your side
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              The Excel Editor gives you a full Handsontable-powered grid to open any uploaded
              file and edit it directly. Format cells, freeze rows, sort, filter — everything
              you expect from a spreadsheet editor.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary-light)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            ref={mockupRef}
            className="flex-1"
            initial={{ opacity: 0, x: 40 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ transform: `translateY(${parallaxY}px)` }}
          >
            <div
              className="flex flex-col items-center justify-center w-full"
              style={{
                aspectRatio: '16/10',
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 0 60px var(--color-primary-glow)',
              }}
            >
              <ImageIcon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
              <span
                className="mt-3 text-xs"
                style={{ color: 'var(--color-text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Excel Editor — AI Mutation Diff View
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
