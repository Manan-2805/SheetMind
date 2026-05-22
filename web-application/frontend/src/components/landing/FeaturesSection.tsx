import { motion } from 'framer-motion'
import {
  BarChart2,
  Bookmark,
  Cpu,
  Download,
  Files,
  LayoutDashboard,
  Lock,
  MessageSquare,
  ShieldCheck,
  Table,
  Users,
  Wand2,
} from 'lucide-react'

import FeatureCard from '@/components/common/FeatureCard'
import SectionBadge from '@/components/common/SectionBadge'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const features = [
  { icon: MessageSquare, name: 'Natural Language Queries', description: 'Ask questions about your Excel data in plain English. SheetMind converts them to SQL and returns instant results \u2014 no database knowledge required.' },
  { icon: Files, name: 'Multi-File Support', description: 'Reference multiple Excel files in a single query using # mentions. Join data across files as naturally as asking a question.' },
  { icon: BarChart2, name: 'Chart Builder', description: 'Generate bar charts, line graphs, pie charts, scatter plots, and 7 more chart types from any query result with one click.' },
  { icon: Table, name: 'Excel Editor', description: 'Open any uploaded file in a full Handsontable-powered spreadsheet editor. Format cells, freeze rows, and edit data directly.' },
  { icon: Wand2, name: 'AI Data Mutations', description: "Describe changes in plain English: 'increase column D by 10% where column E is less than 50.' Preview the exact diff before applying." },
  { icon: LayoutDashboard, name: 'Live Dashboards', description: 'Build dashboards powered by your saved queries. Auto-refreshes every time you open it. Export as PNG with one click.' },
  { icon: Bookmark, name: 'Saved Queries', description: 'Save your best queries with labels. Reuse them from anywhere. Run them directly from the saved queries drawer and see live results.' },
  { icon: Cpu, name: 'Multi-LLM Support', description: 'Connect your OpenAI API key for GPT-4, or run completely offline with a local Ollama model. Your choice, switchable at any time.' },
  { icon: Lock, name: '100% Local & Private', description: 'All data stays on your machine. No telemetry, no cloud sync, no analytics. Your Excel data is never sent to any server.' },
  { icon: Users, name: 'Multi-User Accounts', description: 'Multiple local user accounts, each with fully isolated data, upload history, and settings. No passwords required.' },
  { icon: Download, name: 'Artifacts & Exports', description: 'Every query result can be exported as an Excel file. Every chart can be saved as PNG or SVG. All stored locally in your artifacts.' },
  { icon: ShieldCheck, name: 'Confidence Scoring', description: 'Every AI-generated query comes with a confidence score (1\u20135). Low-confidence results trigger a warning so you know when to verify.' },
]

export default function FeaturesSection() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section id="features" className="py-[120px] px-6" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <div ref={ref} className="mx-auto max-w-7xl">
        <motion.div
          className="flex flex-col items-center text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <SectionBadge text="FEATURES" />
          <h2
            className="mt-6 text-3xl font-bold md:text-5xl"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Everything your spreadsheets deserve
          </h2>
          <p
            className="mt-4 max-w-2xl text-base md:text-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            From natural language queries to AI-powered editing — SheetMind transforms
            how you work with Excel data.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: Math.floor(i / 3) * 0.2 + (i % 3) * 0.1 }}
            >
              <FeatureCard
                icon={feature.icon}
                name={feature.name}
                description={feature.description}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
