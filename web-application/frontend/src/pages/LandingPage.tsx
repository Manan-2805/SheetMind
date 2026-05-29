import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  BarChart2,
  Bookmark,
  ChevronRight,
  Cpu,
  Download,
  Files,
  LayoutDashboard,
  Lock,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  Table,
  Users,
  Wand2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

import ClickSpark from '@/components/common/ClickSpark';

interface AppleButtonProps {
  label?: string;
  full?: boolean;
}

const AppleLogo = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 384 512"
    fill="currentColor"
    className={className}
  >
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const LogoMark = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    viewBox="0 0 256 256"
    fill="#ffffff"
    className={className}
  >
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

const AppleButton = ({ label = 'Download SheetMind', full = false }: AppleButtonProps) => (
  <button
    className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-3 transition-all hover:bg-white/90 active:scale-[0.98] ${
      full ? 'w-full' : ''
    }`}
  >
    <AppleLogo className="w-4 h-4 fill-black" />
    <span>{label}</span>
    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
  </button>
);

const SectionEyebrow = ({ label, tag }: { label: string; tag?: string }) => (
  <div className="inline-flex items-center gap-2.5">
    <span className="w-1.5 h-1.5 rounded-full bg-white" />
    <span className="text-xs uppercase tracking-widest text-white/50 font-semibold">{label}</span>
    {tag && (
      <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-[10px] tracking-normal font-medium">
        {tag}
      </span>
    )}
  </div>
);

const gradientStyle = {
  backgroundImage: 'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'url(#c3-noise)',
};

const features = [
  { icon: MessageSquare, name: 'Natural Language Queries', description: 'Ask questions about your Excel data in plain English. SheetMind converts them to SQL and returns instant results — no database knowledge required.' },
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
  { icon: ShieldCheck, name: 'Confidence Scoring', description: 'Confidence levels (1–5) accompany every generated query. Low-confidence results trigger a warning so you know when to verify.' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = ['Features', 'Documentation'];

  return (
    <ClickSpark
      sparkColor="#8B5CF6"
      sparkSize={20}
      sparkRadius={30}
      sparkCount={9}
      duration={500}
    >
      <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white pt-16">
        
        {/* Global background video (fixed, behind everything) */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
          />
        </div>

        {/* Global Guide Lines */}
        <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
        <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

        {/* Root SVG Noise Filter */}
        <svg className="absolute w-0 h-0 pointer-events-none">
          <defs>
            <filter id="c3-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
              <feComposite in2="SourceGraphic" operator="in" result="noise" />
              <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
            </filter>
          </defs>
        </svg>

        {/* SECTION 1 - STICKY NAVBAR */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 bg-[#0c0c0c]/70 backdrop-blur-md border-b border-white/10 h-16 flex items-center"
        >
          <div className="max-w-6xl w-full mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/">
                <LogoMark className="w-8 h-8 text-white" />
              </Link>
            </div>

            <div className="hidden md:flex gap-8 items-center">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.05, ease: 'easeOut' }}
                >
                  <a
                    href={item === 'Features' ? '#features' : '/docs'}
                    className="text-white/70 text-sm font-medium hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </motion.div>
              ))}
            </div>

            <div className="hidden md:block">
              <AppleButton />
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </motion.nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[#0c0c0c]/95 border-b border-white/10 backdrop-blur-xl px-6 py-8 flex flex-col gap-6 md:hidden"
          >
            {menuItems.map((item) => (
              <a
                key={item}
                href={item === 'Features' ? '#features' : '/docs'}
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 text-lg font-medium hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
            <div className="pt-4 border-t border-white/10">
              <AppleButton full />
            </div>
          </motion.div>
        )}

        {/* SECTION 2 - HERO */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 md:pt-28 pb-20 text-center flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
          >
            Your spreadsheet.<br />
            <span
              className="animate-shiny inline-block mt-3"
              style={gradientStyle}
            >
              Revitalized
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
          >
            SheetMind is the premier spreadsheet query platform. It leverages powerful local and cloud AI to query, analyze, and mutate your Excel files using simple natural language.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <AppleButton />
            <span className="text-xs text-white/40 tracking-wider">
              Download for Intel / Apple Silicon
            </span>
          </motion.div>
        </section>

        {/* SECTION 3 - macOS MENU BAR STRIP */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="relative z-10 w-full h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
        >
          <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-4">
              <AppleLogo className="w-3.5 h-3.5 text-white" />
              <span className="font-bold text-white">SheetMind</span>
              {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((menu, i) => (
                <span
                  key={menu}
                  className={`hover:text-white cursor-pointer ${
                    i > 2 ? (i > 3 ? 'hidden md:inline' : 'hidden sm:inline') : 'inline'
                  }`}
                >
                  {menu}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Search className="w-3.5 h-3.5 text-white/50" />
              <span>Wed May 6 1:09 PM</span>
            </div>
          </div>
        </motion.section>

        {/* SECTION 4 - TEMPORARY APPLICATION MOCKUP IMAGE PLACEHOLDER */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl shadow-2xl p-2 liquid-glass"
          >
            <div className="w-full h-[520px] rounded-xl bg-gradient-to-br from-[#0e1014] via-[#161a22] to-[#0c0c0c] flex items-center justify-center border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-brand/10 via-transparent to-transparent opacity-50" />
              <div className="text-center z-10 px-4">
                <LogoMark className="w-16 h-16 text-white mx-auto opacity-70 mb-4 animate-pulse" />
                <span className="text-sm font-semibold uppercase tracking-widest text-white/50">SheetMind Interface Mockup</span>
                <p className="text-xs text-white/35 mt-2 max-w-xs mx-auto leading-relaxed">
                  This preview placeholder will be replaced with the original high quality application dashboard screenshot.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SECTION 5 - FEATURES SECTION (12 LIQUID GLASS CARDS) */}
        <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="flex flex-col items-center text-center mb-16">
            <SectionEyebrow label="Features" tag="Free & Open Source" />
            <h2 className="mt-6 text-3xl font-bold md:text-5xl text-white">
              Everything your spreadsheets deserve
            </h2>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-white/60">
              From natural language queries to AI-powered editing — SheetMind transforms how you work with Excel data, running entirely locally.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                  className="liquid-glass rounded-2xl p-6 shadow-xl hover:bg-white/[0.02] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand mb-4 border border-white/5">
                    <Icon className="w-5 h-5 text-brand" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{feature.name}</h3>
                  <p className="text-xs leading-relaxed text-white/60">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION 6 - TESTIMONIALS */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'SheetMind gave our finance team four hours of their week back. It queries spreadsheets like magic.',
                name: 'Parker Wilf',
                role: 'Head of Finance',
                company: 'MERCURY',
              },
              {
                quote: "The AST-safe formula injection alone has changed how we process client data. I can't imagine going back to manual Excel formula writing.",
                name: 'Andrew von Rosenbach',
                role: 'Director of Data Operations',
                company: 'COHERE',
              },
              {
                quote: 'NL-to-SQL that actually understands multi-sheet relationships. Our analysts stopped dreading weekly report builds.',
                name: 'Mathies Christensen',
                role: 'Lead Analytics Engineer',
                company: 'LUNAR',
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="liquid-glass rounded-2xl p-6 flex flex-col justify-between shadow-xl hover:bg-white/[0.02] transition-all"
              >
                <blockquote className="text-sm text-white/80 leading-[1.6] italic">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/50 mt-0.5">{t.role}</div>
                  <div className="text-xs text-white font-semibold tracking-wide uppercase mt-1">
                    {t.company}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* SECTION 7 - FINAL CTA */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center shadow-2xl border border-white/10"
          >
            {/* Radial glow */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background: 'radial-gradient(600px circle at 50% 0%, rgba(255, 255, 255, 0.15), transparent 70%)',
              }}
            />

            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
              Close the spreadsheets.<br />
              Query SheetMind.
            </h2>

            <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
              SheetMind is completely free, open-source, and runs entirely offline. Query your spreadsheets with local natural language models — zero cloud dependencies.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <AppleButton label="Download SheetMind" />
              <a
                href="https://github.com/Manan-2805/SheetMind"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-all"
              >
                <span>GitHub Repository</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
              </a>
            </div>
          </motion.div>
        </section>

      </div>
    </ClickSpark>
  );
}
