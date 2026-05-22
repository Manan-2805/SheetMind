import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

import ParticleBackground from '@/components/landing/ParticleBackground'
import SectionBadge from '@/components/common/SectionBadge'

export default function HeroSection() {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)

  const handleScroll = useCallback(() => {
    setShowScrollIndicator(window.scrollY < 100)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  }

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      <ParticleBackground />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <SectionBadge text="AI-Powered Excel Intelligence" />
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-8 text-4xl font-extrabold leading-tight md:text-6xl lg:text-[64px]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Intelligence built into
          <br />
          every sheet.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-[540px] text-base md:text-lg leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Query your Excel files in plain English. Build dashboards.
          Edit data with AI. Everything runs locally — no cloud required.
        </motion.p>

        <motion.div variants={itemVariants} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <div className="relative group">
            <button
              className="rounded-md px-5 h-11 text-sm font-medium opacity-60 cursor-not-allowed"
              style={{
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
              disabled
            >
              Download for Desktop
            </button>
            <div
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-md px-3 py-1.5 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Coming Soon — Join the waitlist
            </div>
          </div>
          <Link
            to="/docs"
            className="rounded-md px-5 h-11 text-sm font-medium text-white flex items-center transition-shadow duration-200"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 30px var(--color-primary-glow)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            Read the Documentation →
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {['OpenAI Compatible', 'Ollama Support', '100% Local', 'No Cloud Required'].map((badge) => (
            <span
              key={badge}
              className="rounded-full px-3 py-1 text-xs"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500"
        style={{ opacity: showScrollIndicator ? 1 : 0 }}
      >
        <ChevronDown
          size={24}
          className="animate-bounce"
          style={{ color: 'var(--color-text-tertiary)' }}
        />
      </div>
    </section>
  )
}
