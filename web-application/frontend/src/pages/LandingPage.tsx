import { useState } from 'react';

import { motion } from 'framer-motion';
import {
  Bot,
  ChevronRight,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Menu,
  MoreHorizontal,
  Search,
  Sparkles,
  Table,
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

export default function LandingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeTab, setActiveTab] = useState('Chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = ['Features', 'Pricing', 'Blog', 'Documentation', 'Careers'];
  const mockSheets = [
    { name: 'Sales_Data.xlsx', color: '#00d2ff' },
    { name: 'Customers.xlsx', color: '#A4F4FD' },
    { name: 'Inventory.xlsx', color: '#f59e0b' },
    { name: 'Expenses.xlsx', color: '#10b981' },
  ];

  const recentQueries = [
    { title: 'Sales Analysis', desc: 'Top 5 products by revenue...', table: 'Sales_Data', time: '9:41 AM', active: true },
    { title: 'Sophia Chen', desc: 'Re-calculate commission formulas...', table: 'Staff_Salaries', time: '8:12 AM', active: false },
    { title: 'Inventory Audit', desc: 'Find items with low stock...', table: 'Inventory', time: 'Yesterday', active: false },
    { title: 'Stripe Sync', desc: 'List all payout gaps...', table: 'Payouts', time: 'Yesterday', active: false },
    { title: 'Vercel Deploy', desc: 'Audit deployment performance...', table: 'Deploy_Log', time: 'Mon', active: false },
    { title: 'GitHub Activity', desc: 'List PR review lead time...', table: 'PR_Metrics', time: 'Mon', active: false },
  ];

  return (
    <ClickSpark
      sparkColor="#8B5CF6"
      sparkSize={20}
      sparkRadius={30}
      sparkCount={9}
      duration={500}
    >
      <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
        
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

        {/* SECTION 1 - NAVBAR */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-50 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between"
        >
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
                <Link
                  to={`/${item.toLowerCase()}`}
                  className="text-white/70 text-sm font-medium hover:text-white transition-colors"
                >
                  {item}
                </Link>
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
        </motion.nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-20 left-0 right-0 z-40 bg-[#0c0c0c]/95 border-b border-white/10 backdrop-blur-xl px-6 py-8 flex flex-col gap-6 md:hidden"
          >
            {menuItems.map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 text-lg font-medium hover:text-white transition-colors"
              >
                {item}
              </Link>
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

        {/* SECTION 4 - APPLICATION MOCKUP */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl shadow-2xl"
          >
            {/* Title bar */}
            <div className="h-12 border-b border-white/10 bg-black/20 flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="text-xs text-white/50 font-medium">
                SheetMind — Query & Editor
              </div>
              <div className="w-14" />
            </div>

            {/* Body */}
            <div className="grid grid-cols-12 h-[520px]">
              
              {/* Sidebar */}
              <div className="col-span-12 md:col-span-3 border-r border-white/10 bg-black/30 p-4 flex flex-col justify-between overflow-y-auto">
                <div className="flex flex-col gap-5">
                  <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2.5 transition-all hover:bg-white/90 active:scale-[0.98]">
                    <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
                    <span>New Query</span>
                  </button>

                  <div className="flex flex-col gap-1">
                    {[
                      { name: 'Chat', icon: Bot, count: 12, active: true },
                      { name: 'History', icon: History, count: 3, active: false },
                      { name: 'Artifacts', icon: FileText, count: 0, active: false },
                      { name: 'Saved Queries', icon: Sparkles, count: 2, active: false },
                      { name: 'Data Sources', icon: Database, count: 0, active: false },
                      { name: 'Excel Editor', icon: Table, count: 0, active: false },
                    ].map((nav) => (
                      <button
                        key={nav.name}
                        onClick={() => setActiveTab(nav.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          nav.name === activeTab
                            ? 'bg-white/10 text-white'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <nav.icon className="w-3.5 h-3.5" />
                          <span>{nav.name}</span>
                        </div>
                        {nav.count > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/50 text-[10px]">
                            {nav.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="text-[10px] font-bold tracking-wider uppercase text-white/40 mb-2 px-1">
                    Data Sources
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {mockSheets.map((sheet) => (
                      <div
                        key={sheet.name}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: sheet.color }} />
                        <span className="text-white/70 truncate">{sheet.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Query stream */}
              <div className="hidden md:flex md:col-span-4 border-r border-white/10 flex-col overflow-y-auto">
                <div className="p-3 border-b border-white/10 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search queries"
                    className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
                <div className="divide-y divide-white/5">
                  {recentQueries.map((query) => (
                    <div
                      key={query.title}
                      className={`p-3 flex flex-col gap-1 transition-all cursor-pointer ${
                        query.active ? 'bg-white/5 border-l-2 border-brand' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">{query.title}</span>
                        <span className="text-[10px] text-white/40">{query.time}</span>
                      </div>
                      <span className="text-[11px] text-white/50 line-clamp-1">{query.desc}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <FileSpreadsheet className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] text-cyan-400 font-semibold">{query.table}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytical viewer */}
              <div className="col-span-12 md:col-span-5 flex flex-col justify-between overflow-y-auto">
                <div>
                  {/* Toolbar */}
                  <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/10">
                    <div className="flex gap-2">
                      {['Export PNG', 'View SQL', 'Saved Queries', 'Settings'].map((btn) => (
                        <button
                          key={btn}
                          className="px-2 py-1 rounded-md text-[10px] font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                    <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-white/60">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Header info */}
                  <div className="p-4 flex items-center gap-3 border-b border-white/5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-white font-bold text-sm shadow">
                      S
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-white">Sales Analysis</h3>
                      <div className="text-[10px] text-white/40 truncate">
                        Sales_Data · by AI Agent · 9:41 AM
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-semibold">
                      Analytical
                    </span>
                  </div>

                  {/* Main content body */}
                  <div className="p-4 flex flex-col gap-4">
                    {/* Insight Card */}
                    <div className="rounded-xl border border-[#A4F4FD]/20 bg-[#A4F4FD]/5 p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <Sparkles className="w-3.5 h-3.5 fill-cyan-300" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">AI Insight by SheetMind</span>
                      </div>
                      <p className="text-[11px] leading-[1.4] text-white/80">
                        Product 'Pro Macbook' contributed 42% of total sales, followed by 'Studio Display' at 18%. Revenue shows a 12% MoM growth.
                      </p>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                      <table className="w-full border-collapse text-[10px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-white/50 text-left">
                            <th className="p-2 font-semibold">Product</th>
                            <th className="p-2 font-semibold text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          <tr>
                            <td className="p-2 font-medium">Pro Macbook</td>
                            <td className="p-2 text-right font-semibold">$120,400</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-medium">Studio Display</td>
                            <td className="p-2 text-right font-semibold">$52,000</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-medium">Keyboard</td>
                            <td className="p-2 text-right font-semibold">$14,000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Attachment / Download pill */}
                <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] text-white/70 font-medium">sales-summary-q1.xlsx</span>
                  </div>
                  <button className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold transition-all">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download summary</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </section>

        {/* SECTION 5 - FEATURE QUERY */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-start"
            >
              <SectionEyebrow label="Query" tag="AI-native" />
              <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02] text-white">
                Query spreadsheets<br />
                in a single pass.
              </h2>
              <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
                SheetMind reads your question, maps the columns, and executes highly optimized local queries. Focus on finding insights — let our AI handle the SQL generation and formula logic.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  'Natural Language to SQL',
                  'Automatic Visualization',
                  'Excel Direct Editing',
                  'AI Formula Injection',
                ].map((chip) => (
                  <span
                    key={chip}
                    className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/5 transition-all cursor-default"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right Column */}
            <div className="liquid-glass rounded-2xl p-5 shadow-2xl">
              <div className="text-xs text-white/40 tracking-wider mb-4 font-medium uppercase">
                Today · 42 analytical queries executed
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { title: 'Schema Resolved', count: 4, color: '#ffffff', items: ['Sales_Data.xlsx', 'Customers.xlsx'] },
                  { title: 'SQL Generated', count: 7, color: '#e5e5e5', items: ['SELECT product, SUM(revenue)...', 'SELECT customer_name...'] },
                  { title: 'Charts Rendered', count: 18, color: '#a3a3a3', items: ['Monthly Sales (Bar)', 'User Retention (Line)'] },
                  { title: 'Excel Backups', count: 13, color: '#525252', items: ['Sales_Data_Backup_2026.xlsx', 'Expenses_Backup.xlsx'] },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="liquid-glass rounded-lg p-3 hover:bg-white/[0.02] transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-white/90">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-white/50">{item.count} items</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {item.items.map((sub, i) => (
                        <div key={i} className="text-[10px] font-mono text-white/60 truncate pl-3">
                          {sub}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 6 - LOGO CLOUD */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-white/40 font-semibold">
              Trusted by the world's most analytical teams
            </span>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 justify-center items-center">
            {[
              'Linear',
              'Vercel',
              'Figma',
              'Stripe',
              'Ramp',
              'Notion',
              'Loom',
              'Arc',
            ].map((logo, i) => (
              <motion.div
                key={logo}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="text-center"
              >
                <span className="text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors cursor-default">
                  {logo}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECTION 7 - TESTIMONIALS */}
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

        {/* SECTION 8 - PRICING */}
        <section className="c3-pricing-section relative z-10">
          
          {/* Pricing SVG Noise Filter */}
          <svg className="absolute w-0 h-0 pointer-events-none">
            <defs>
              <filter id="c3-noise-pricing">
                <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.075" />
                </feComponentTransfer>
                <feComposite in2="SourceGraphic" operator="in" result="noise" />
                <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
              </filter>
            </defs>
          </svg>

          {/* Watermark Line */}
          <div className="c3-watermark-container">
            <div className="c3-watermark-main" style={{ filter: 'url(#c3-noise-pricing)' }}>
              <span className="c3-watermark-line-1">Your spreadsheet.</span>
              <span className="c3-watermark-line-2">Revitalized</span>
            </div>
          </div>

          {/* Toggle Block */}
          <div className="c3-toggle-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Yearly billing
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`c3-toggle ${isYearly ? 'active' : ''}`}
            >
              <span className="c3-toggle-knob" />
            </button>
          </div>

          {/* Grid Blocks */}
          <div className="c3-grid">
            
            {/* Card 1 */}
            <div className="c3-card">
              <span className="c3-tier-small">Free</span>
              <span className="c3-tier-large">Free</span>
              <p className="c3-desc">
                For individuals getting started with SheetMind.
              </p>
              <ul className="c3-list">
                {[
                  'Up to 3 Excel files',
                  'Local DuckDB database',
                  'Basic NL-to-SQL querying',
                  'Standard table and 3 basic charts',
                  'Access via desktop client',
                ].map((feat) => (
                  <li key={feat}>
                    <span className="c3-check">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

            {/* Card 2 */}
            <div className="c3-card">
              <span className="c3-tier-small">Standard</span>
              <span className="c3-tier-large">
                {isYearly ? '$99.99/y' : '$9.99/m'}
              </span>
              <p className="c3-desc">
                For freelancers and small teams who need absolute freedom and flexibility.
              </p>
              <ul className="c3-list">
                {[
                  'Up to 50 Excel files',
                  'Advanced chart builder (10 types)',
                  'Direct Excel grid editor',
                  'AI-powered formula injection & mutation',
                  'Automatic local version backups',
                ].map((feat) => (
                  <li key={feat}>
                    <span className="c3-check">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

            {/* Card 3 */}
            <div className="c3-card c3-card-pro">
              <span className="c3-tier-small">Pro</span>
              <span className="c3-tier-large">
                {isYearly ? '$199.99/y' : '$19.99/m'}
              </span>
              <p className="c3-desc">
                For agencies, finance departments, and data professionals.
              </p>
              <ul className="c3-list">
                {[
                  'Unlimited Excel files',
                  'Advanced multi-sheet relationship detection',
                  'Dashboard creator with live unbound widget builder',
                  'PNG & PDF dashboard exports',
                  'Premium customer support',
                ].map((feat) => (
                  <li key={feat}>
                    <span className="c3-check">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

          </div>
        </section>

        {/* SECTION 9 - FINAL CTA */}
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
              Join thousands of builders, analysts, and operators who query data with natural language — not tedious VLOOKUPs.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <AppleButton label="Download SheetMind" />
              <button className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-all">
                <span>Talk to sales</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
              </button>
            </div>
          </motion.div>
        </section>

      </div>
    </ClickSpark>
  );
}
