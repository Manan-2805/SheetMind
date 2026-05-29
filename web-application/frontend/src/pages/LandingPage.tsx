import { useEffect, useState } from 'react';

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

import CircularGallery from '@/components/common/CircularGallery';
import ClickSpark from '@/components/common/ClickSpark';
import ScrollStack from '@/components/common/ScrollStack';
import BorderTrail from '@/components/ui/BorderTrail';

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

const galleryItems = [
  { image: 'https://picsum.photos/seed/sm1/800/600', text: 'NL Query Interface' },
  { image: 'https://picsum.photos/seed/sm2/800/600', text: 'Chart Builder' },
  { image: 'https://picsum.photos/seed/sm3/800/600', text: 'Excel Editor' },
  { image: 'https://picsum.photos/seed/sm4/800/600', text: 'Live Dashboards' },
  { image: 'https://picsum.photos/seed/sm5/800/600', text: 'Data Sources' },
  { image: 'https://picsum.photos/seed/sm6/800/600', text: 'Saved Queries' },
];

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
}

function FeatureCardWrapper({ feature, index }: { feature: FeatureItem; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = feature.icon;
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-full"
    >
      <BorderTrail
        size={80}
        style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }}
        gradientId={`trail-gradient-feat-${index}`}
        className="h-full"
      >
        <div className="liquid-glass rounded-2xl p-6 shadow-xl bg-[#0e1014]/40 hover:bg-white/[0.02] transition-all h-full min-h-[160px] flex flex-col justify-start">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand mb-4 border border-white/5">
            <Icon className="w-5 h-5 text-brand" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">{feature.name}</h3>
          <p className="text-xs leading-relaxed text-white/60">{feature.description}</p>
        </div>
      </BorderTrail>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const formatted = new Date().toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const featureCards = features.map((feature, i) => (
    <FeatureCardWrapper key={feature.name} feature={feature} index={i} />
  ));

  return (
    <ClickSpark
      sparkColor="#8B5CF6"
      sparkSize={20}
      sparkRadius={30}
      sparkCount={9}
      duration={500}
    >
      <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white pt-24">
        
        {/* Global background video */}
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

        {/* SECTION 1 - FLOATING PILL NAVBAR */}
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 flex justify-center pointer-events-none">
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-[calc(100%-2rem)] sm:w-full max-w-4xl rounded-full border border-white/10 bg-black/40 backdrop-blur-xl px-6 h-12 flex items-center justify-between pointer-events-auto"
          >
            <div className="flex items-center">
              <Link to="/">
                <LogoMark className="w-6 h-6 text-white" />
              </Link>
            </div>

            <div className="hidden md:flex gap-6 items-center">
              <a href="#features" className="text-white/70 text-xs font-medium hover:text-white transition-colors">
                Features
              </a>
              <Link to="/docs" className="text-white/70 text-xs font-medium hover:text-white transition-colors">
                Documentation
              </Link>
              <Link
                to="/login"
                className="border border-white/20 rounded-full px-4 py-1 text-xs font-medium text-white hover:bg-white/10 transition-all"
              >
                Get Started
              </Link>
            </div>

            <div className="hidden md:block">
              <AppleButton />
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </motion.nav>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-16 left-4 right-4 z-40 bg-[#0c0c0c]/95 border border-white/10 rounded-2xl backdrop-blur-xl px-6 py-8 flex flex-col gap-6 md:hidden"
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/70 text-base font-medium hover:text-white transition-colors"
            >
              Features
            </a>
            <Link
              to="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/70 text-base font-medium hover:text-white transition-colors"
            >
              Documentation
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="border border-white/20 rounded-full px-4 py-2 text-center text-sm font-medium text-white hover:bg-white/10 transition-all w-full"
            >
              Get Started
            </Link>
            <div className="pt-4 border-t border-white/10">
              <AppleButton full />
            </div>
          </motion.div>
        )}

        {/* SECTION 2 - HERO (WITH BORDER TRAIL) */}
        <section className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-16 md:py-24 lg:py-32 flex flex-col items-center">
          <div className="mx-auto max-w-4xl w-full">
            <BorderTrail
              size={120}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              gradientId="hero-trail"
              className="p-1 border border-white/5 shadow-2xl bg-black/40 backdrop-blur-md"
            >
              <div className="px-6 py-12 md:py-20 rounded-2xl flex flex-col items-center text-center">
                <motion.h1
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]"
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
              </div>
            </BorderTrail>
          </div>
        </section>

        {/* SECTION 3 - macOS MENU BAR STRIP (WITH LIVE TIME) */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="relative z-10 w-full h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between text-xs text-white/70">
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
              <span>{currentTime}</span>
            </div>
          </div>
        </motion.section>

        {/* SECTION 4 - TEMPORARY APPLICATION MOCKUP IMAGE PLACEHOLDER */}
        <section className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl">
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
          </div>
        </section>

        {/* SECTION 5 - FEATURES SECTION (SCROLL STACK) */}
        <section id="features" className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center mb-16"
            >
              <SectionEyebrow label="Features" tag="Free & Open Source" />
              <h2 className="mt-6 text-3xl font-bold md:text-5xl text-white">
                Everything your spreadsheets deserve
              </h2>
              <p className="mt-4 max-w-2xl text-base md:text-lg text-white/60">
                From natural language queries to AI-powered editing — SheetMind transforms how you work with Excel data, running entirely locally.
              </p>
            </motion.div>

            {/* ScrollStack with Fallback */}
            <div className="hidden md:block">
              <ScrollStack items={featureCards} minHeight="650px" />
            </div>
            
            <div className="md:hidden grid grid-cols-1 gap-4">
              {featureCards}
            </div>
          </div>
        </section>

        {/* SECTION 6 - CIRCULAR GALLERY ACTION SHOWCASE */}
        <section className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-16 md:py-24 lg:py-32 border-t border-white/10 bg-black/10">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center mb-12"
            >
              <SectionEyebrow label="Gallery" />
              <h2 className="mt-6 text-3xl font-bold md:text-5xl text-white">See SheetMind in action</h2>
              <p className="mt-4 max-w-2xl text-base md:text-lg text-white/60">
                From natural language queries to live dashboards — a visual tour of SheetMind's capabilities.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="w-full"
            >
              <CircularGallery
                items={galleryItems}
                bend={3}
                height={isMobile ? 300 : 500}
              />
            </motion.div>
          </div>
        </section>

        {/* SECTION 7 - FINAL CTA (WITH BORDER TRAIL & STACK RESPONSIVENESS) */}
        <section className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-16 md:py-24 lg:py-32 border-t border-white/10">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <BorderTrail
                size={120}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                gradientId="cta-trail"
              >
                <div className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center shadow-2xl bg-[#0e1014]/65 backdrop-blur-2xl">
                  {/* Radial glow */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      background: 'radial-gradient(600px circle at 50% 0%, rgba(255, 255, 255, 0.15), transparent 70%)',
                    }}
                  />

                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.02]">
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
                      className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-all w-full sm:w-auto"
                    >
                      <span>GitHub Repository</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
                    </a>
                  </div>
                </div>
              </BorderTrail>
            </motion.div>
          </div>
        </section>

      </div>
    </ClickSpark>
  );
}
