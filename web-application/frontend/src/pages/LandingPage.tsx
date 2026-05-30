import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart2,
  Bookmark,
  BookOpen,
  ChevronRight,
  Cpu,
  Download,
  Files,
  LayoutDashboard,
  Lock,
  Menu,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Table,
  TrendingUp,
  Users,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

import { Link } from 'react-router-dom';
import CircularGallery from '@/components/common/CircularGallery';
import ClickSpark from '@/components/common/ClickSpark';
import ScrollStack, { ScrollStackItem } from '@/components/common/ScrollStack';
import BorderTrail from '@/components/ui/BorderTrail';

// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────

const LogoMark = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="#ffffff" className={className}>
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

interface AppleButtonProps {
  label?: string;
  full?: boolean;
  className?: string;
}

const AppleButton = ({
  label = 'Download SheetMind',
  full = false,
  className = '',
}: AppleButtonProps) => (
  <button
    type="button"
    className={`group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-2.5 transition-all hover:bg-white/90 active:scale-[0.98] ${
      full ? 'w-full' : ''
    } ${className}`}
  >
    <Download className="w-4 h-4" />
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
  backgroundImage:
    'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'url(#c3-noise)',
};

// ─────────────────────────────────────────────
// Gallery items
// ─────────────────────────────────────────────

const galleryItems = [
  { image: 'https://picsum.photos/seed/sm1/800/600', text: 'NL Query Interface' },
  { image: 'https://picsum.photos/seed/sm2/800/600', text: 'Chart Builder' },
  { image: 'https://picsum.photos/seed/sm3/800/600', text: 'Excel Editor' },
  { image: 'https://picsum.photos/seed/sm4/800/600', text: 'Live Dashboards' },
  { image: 'https://picsum.photos/seed/sm5/800/600', text: 'Data Sources' },
  { image: 'https://picsum.photos/seed/sm6/800/600', text: 'Saved Queries' },
];

// ─────────────────────────────────────────────
// Mockup 1: Natural Language Query Console
// ─────────────────────────────────────────────

function NLQueryMockup() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! Ask me anything about your spreadsheet data.',
      table: null as null | { headers: string[]; rows: string[][] },
    },
    {
      role: 'user',
      text: 'Show total sales by region for Q1',
      table: null,
    },
    {
      role: 'assistant',
      text: 'Here are the Q1 sales grouped by region:',
      table: {
        headers: ['Region', 'Sales', 'Change'],
        rows: [
          ['North', '$142,400', '+12%'],
          ['South', '$98,200', '+5%'],
          ['East', '$210,800', '+19%'],
          ['West', '$76,500', '-3%'],
        ],
      },
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const text = query.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text, table: null }]);
    setQuery('');
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: 'Running SQL... Results ready.',
          table: {
            headers: ['Column A', 'Column B', 'Total'],
            rows: [
              ['Alpha', '32', '320'],
              ['Beta', '18', '180'],
            ],
          },
        },
      ]);
    }, 700);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat history */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scroll">
        {messages.map((msg, i) => (
          <div
            key={`msg-${i}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand/30 border border-brand/20 text-white/90'
                  : 'bg-white/5 border border-white/10 text-white/80'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3 h-3 text-brand" />
                  <span className="text-brand text-[10px] font-semibold uppercase tracking-wider">
                    AI
                  </span>
                </div>
              )}
              <p>{msg.text}</p>
              {msg.table && (
                <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-white/10">
                        {msg.table.headers.map((h) => (
                          <th key={h} className="text-left px-2 py-1 text-white/60 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.table.rows.map((row, ri) => (
                        <tr
                          key={`row-${ri}`}
                          className="border-t border-white/5 hover:bg-white/[0.03]"
                        >
                          {row.map((cell, ci) => (
                            <td key={`cell-${ci}`} className="px-2 py-1 text-white/70">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="mt-3 flex gap-2 items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask your spreadsheet..."
          className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/30 outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          className="text-brand hover:text-white transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mockup 2: Spreadsheet Editor
// ─────────────────────────────────────────────

function SpreadsheetMockup() {
  const cols = ['', 'A', 'B', 'C', 'D', 'E'];
  const rows = [
    ['1', 'Product', 'Q1', 'Q2', 'Q3', 'Total'],
    ['2', 'Widget A', '4,200', '5,100', '6,800', '=SUM(B2:D2)'],
    ['3', 'Widget B', '3,100', '2,900', '4,200', '=SUM(B3:D3)'],
    ['4', 'Widget C', '6,400', '7,200', '8,100', '=SUM(B4:D4)'],
    ['5', 'Widget D', '1,800', '2,400', '2,900', '=SUM(B5:D5)'],
    ['6', 'Total', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '=SUM(E2:E5)'],
  ];
  const [selected, setSelected] = useState<[number, number]>([1, 4]);
  const [activeFormula, setActiveFormula] = useState('=SUM(B2:D2)');

  return (
    <div className="flex flex-col h-full">
      {/* Formula bar */}
      <div className="flex items-center gap-2 mb-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs">
        <span className="text-white/40 font-mono text-[10px] border border-white/10 rounded px-1.5 py-0.5 bg-white/5">
          {cols[selected[1]]}
          {selected[0] + 1}
        </span>
        <span className="text-brand/70 font-mono text-[10px] flex-1 truncate">{activeFormula}</span>
      </div>

      {/* Grid */}
      <div className="overflow-auto custom-scroll flex-1 rounded-lg border border-white/10">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr>
              {cols.map((c, ci) => (
                <th
                  key={`col-${ci}`}
                  className={`sticky top-0 text-center px-2 py-1 border-b border-r border-white/10 font-semibold ${
                    ci === 0 ? 'w-6 bg-white/5 text-white/30' : 'bg-[#12151c] text-white/50'
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={`row-${ri}`}
                className={ri === 0 ? 'bg-white/5' : ri === rows.length - 1 ? 'bg-brand/5' : ''}
              >
                {row.map((cell, ci) => {
                  const isSelected = selected[0] === ri && selected[1] === ci;
                  const isFormula = cell.startsWith('=');
                  const isHeader = ri === 0 || ci === 0;
                  return (
                    <td
                      key={`cell-${ri}-${ci}`}
                      onClick={() => {
                        setSelected([ri, ci]);
                        setActiveFormula(isFormula ? cell : cell);
                      }}
                      className={`px-2 py-1 border-b border-r border-white/[0.06] cursor-pointer text-left truncate max-w-[80px] transition-colors ${
                        isSelected ? 'bg-brand/20 border-brand/40 text-white' : ''
                      } ${isHeader && ci === 0 ? 'text-white/30 text-center font-mono' : ''} ${
                        isHeader && ri === 0 ? 'text-white font-semibold bg-white/5' : ''
                      } ${isFormula && !isSelected ? 'text-emerald-400/70' : 'text-white/80'} ${
                        ri === rows.length - 1 && ci > 0 ? 'font-bold text-white' : ''
                      } hover:bg-white/5`}
                    >
                      {isFormula && !isSelected ? '16,100' : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mockup 3: SVG Bar Chart Builder
// ─────────────────────────────────────────────

function ChartMockup() {
  const data = [
    { label: 'Jan', value: 42, color: '#8B5CF6' },
    { label: 'Feb', value: 68, color: '#6366F1' },
    { label: 'Mar', value: 55, color: '#8B5CF6' },
    { label: 'Apr', value: 82, color: '#A78BFA' },
    { label: 'May', value: 73, color: '#6366F1' },
    { label: 'Jun', value: 91, color: '#8B5CF6' },
  ];
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const maxVal = Math.max(...data.map((d) => d.value));
  const svgH = 140;
  const svgW = 360;
  const barW = 38;
  const gap = 22;
  const padLeft = 30;
  const padBottom = 24;
  const padTop = 12;
  const plotH = svgH - padBottom - padTop;

  const points = data.map((d, i) => {
    const x = padLeft + i * (barW + gap) + barW / 2;
    const y = padTop + plotH - (d.value / maxVal) * plotH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col h-full">
      {/* Chart type toggle */}
      <div className="flex items-center gap-2 mb-3">
        {(['bar', 'line'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setChartType(type)}
            className={`text-[10px] px-3 py-1 rounded-full border transition-all font-medium capitalize ${
              chartType === type
                ? 'bg-brand border-brand/50 text-white'
                : 'border-white/10 text-white/40 hover:text-white/70'
            }`}
          >
            {type === 'bar' ? (
              <BarChart2 className="w-3 h-3 inline mr-1" />
            ) : (
              <TrendingUp className="w-3 h-3 inline mr-1" />
            )}
            {type}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-white/40">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <span>Revenue</span>
        </div>
      </div>

      {/* SVG chart */}
      <div className="flex-1 flex items-end justify-center">
        <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="overflow-visible">
          {/* Y-axis gridlines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = padTop + plotH - (tick / maxVal) * plotH;
            return (
              <g key={`tick-${tick}`}>
                <line
                  x1={padLeft - 4}
                  y1={y}
                  x2={svgW - 8}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={8}
                  fill="rgba(255,255,255,0.3)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bar chart */}
          {chartType === 'bar' &&
            points.map((p, i) => {
              const barH = (p.value / maxVal) * plotH;
              const barY = padTop + plotH - barH;
              const isHov = hoveredIdx === i;
              return (
                <g
                  key={`bar-${i}`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <rect
                    x={padLeft + i * (barW + gap)}
                    y={barY}
                    width={barW}
                    height={barH}
                    rx={4}
                    fill={isHov ? '#A78BFA' : p.color}
                    opacity={isHov ? 1 : 0.75}
                    className="transition-all duration-150"
                  />
                  {isHov && (
                    <text
                      x={padLeft + i * (barW + gap) + barW / 2}
                      y={barY - 4}
                      textAnchor="middle"
                      fontSize={9}
                      fill="white"
                      fontWeight="600"
                    >
                      {p.value}k
                    </text>
                  )}
                  <text
                    x={padLeft + i * (barW + gap) + barW / 2}
                    y={svgH - 6}
                    textAnchor="middle"
                    fontSize={8}
                    fill="rgba(255,255,255,0.4)"
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}

          {/* Line chart */}
          {chartType === 'line' && (
            <>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`${padLeft},${padTop + plotH} ${polyline} ${svgW - 8},${padTop + plotH}`}
                fill="url(#lineGrad)"
              />
              <polyline
                points={polyline}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <g
                  key={`dot-${i}`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIdx === i ? 5 : 3.5}
                    fill="#8B5CF6"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <text
                    x={p.x}
                    y={svgH - 6}
                    textAnchor="middle"
                    fontSize={8}
                    fill="rgba(255,255,255,0.4)"
                  >
                    {p.label}
                  </text>
                  {hoveredIdx === i && (
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      fontSize={9}
                      fill="white"
                      fontWeight="600"
                    >
                      {p.value}k
                    </text>
                  )}
                </g>
              ))}
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mockup 4: KPI Dashboard
// ─────────────────────────────────────────────

function DashboardMockup() {
  const kpis = [
    { label: 'Total Revenue', value: '$1.24M', change: '+18%', up: true },
    { label: 'Avg. Order', value: '$342', change: '+4%', up: true },
    { label: 'Customers', value: '3,621', change: '+11%', up: true },
    { label: 'Churn Rate', value: '2.3%', change: '-0.8%', up: false },
  ];

  const miniSparkData = [30, 45, 35, 60, 55, 80, 72, 90, 85, 95];

  function Sparkline({ data }: { data: number[] }) {
    const max = Math.max(...data);
    const w = 60;
    const h = 24;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
    return (
      <svg width={w} height={h} className="overflow-visible">
        <polyline
          points={pts}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <circle
          cx={((data.length - 1) / (data.length - 1)) * w}
          cy={h - (data[data.length - 1] / max) * h}
          r={2.5}
          fill="#8B5CF6"
        />
      </svg>
    );
  }

  const savedQueries = ['Q1 Revenue by Product', 'Churn by Region', 'Top Customers'];
  const [activeQ, setActiveQ] = useState(0);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 hover:bg-white/[0.08] transition-colors"
          >
            <p className="text-white/40 text-[10px] mb-1">{k.label}</p>
            <p className="text-white font-bold text-base leading-none">{k.value}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span
                className={`text-[10px] font-medium ${k.up ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {k.change}
              </span>
              <Sparkline data={miniSparkData} />
            </div>
          </div>
        ))}
      </div>

      {/* Saved queries list */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
            Saved Queries
          </span>
          <Bookmark className="w-3 h-3 text-white/30" />
        </div>
        <div className="space-y-1.5">
          {savedQueries.map((q, i) => (
            <button
              key={q}
              type="button"
              onClick={() => setActiveQ(i)}
              className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                activeQ === i
                  ? 'bg-brand/20 border border-brand/30 text-white'
                  : 'border border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Zap
                className={`w-3 h-3 flex-shrink-0 ${activeQ === i ? 'text-brand' : 'text-white/30'}`}
              />
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mockup 5: Multi-LLM Model Switcher
// ─────────────────────────────────────────────

function LLMMockup() {
  const models = [
    { id: 'gpt4o', label: 'GPT-4o', provider: 'OpenAI', icon: '✦', color: '#10B981', local: false },
    {
      id: 'ollama-llama',
      label: 'Llama 3.1',
      provider: 'Ollama (Local)',
      icon: '◆',
      color: '#8B5CF6',
      local: true,
    },
    {
      id: 'ollama-mistral',
      label: 'Mistral 7B',
      provider: 'Ollama (Local)',
      icon: '◈',
      color: '#6366F1',
      local: true,
    },
    {
      id: 'gpt35',
      label: 'GPT-3.5',
      provider: 'OpenAI',
      icon: '✧',
      color: '#F59E0B',
      local: false,
    },
  ];
  const [activeModel, setActiveModel] = useState('ollama-llama');
  const [apiKey, setApiKey] = useState('sk-••••••••••••••••••••••••');

  const active = models.find((m) => m.id === activeModel);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Status banner */}
      <div
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 border text-xs"
        style={{ borderColor: `${active?.color}30`, background: `${active?.color}10` }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
          style={{ background: active?.color }}
        />
        <div>
          <p className="text-white font-medium text-[11px]">{active?.label} Active</p>
          <p className="text-white/40 text-[10px]">
            {active?.local ? 'Running locally via Ollama' : 'Connected via API key'}
          </p>
        </div>
        <div className="ml-auto">
          {active?.local ? (
            <Lock className="w-3.5 h-3.5 text-white/30" />
          ) : (
            <Cpu className="w-3.5 h-3.5 text-white/30" />
          )}
        </div>
      </div>

      {/* Model selector */}
      <div className="space-y-1.5 flex-1">
        {models.map((m) => {
          const isActive = activeModel === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveModel(m.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all text-left ${
                isActive
                  ? 'border-white/20 bg-white/8'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border"
                style={{
                  background: `${m.color}18`,
                  borderColor: `${m.color}35`,
                  color: m.color,
                }}
              >
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[11px] font-semibold">{m.label}</p>
                <p className="text-white/40 text-[10px] truncate">{m.provider}</p>
              </div>
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: m.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* API key field (for cloud models) */}
      {!active?.local && (
        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <p className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">API Key</p>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-transparent text-[11px] text-white/60 outline-none font-mono"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Feature card definitions
// ─────────────────────────────────────────────

const featureCards = [
  {
    icon: MessageSquare,
    name: 'Natural Language Queries',
    badge: 'AI-Powered',
    description:
      'Ask questions in plain English. SheetMind converts them to SQL instantly and returns rich, structured results — no database knowledge required.',
    mockup: <NLQueryMockup />,
  },
  {
    icon: Table,
    name: 'Full Spreadsheet Editor',
    badge: 'Handsontable',
    description:
      'Open any uploaded file in a blazing-fast spreadsheet editor. Format cells, freeze rows, write formulas, and edit data directly without leaving the app.',
    mockup: <SpreadsheetMockup />,
  },
  {
    icon: BarChart2,
    name: 'Interactive Chart Builder',
    badge: '11 Chart Types',
    description:
      'Generate bar charts, line graphs, pie charts, scatter plots, and 7 more chart types from any query result with one click. Export as PNG or SVG.',
    mockup: <ChartMockup />,
  },
  {
    icon: LayoutDashboard,
    name: 'Live KPI Dashboards',
    badge: 'Auto-Refresh',
    description:
      'Build dashboards powered by your saved queries. Auto-refreshes every time you open it. Pin your most important metrics front and center.',
    mockup: <DashboardMockup />,
  },
  {
    icon: Cpu,
    name: 'Multi-LLM Support',
    badge: 'Local & Cloud',
    description:
      'Connect your OpenAI API key for GPT-4o, or run completely offline with a local Ollama model. Switch at any time — your data never leaves your machine.',
    mockup: <LLMMockup />,
  },
];

// ─────────────────────────────────────────────
// Feature card wrapper with border trail
// ─────────────────────────────────────────────

function FeatureCard({ card, index }: { card: (typeof featureCards)[number]; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = card.icon;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full"
    >
      <BorderTrail
        size={120}
        style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s' }}
        gradientId={`trail-feat-${index}`}
        className="w-full"
      >
        <div className="liquid-glass rounded-3xl bg-[#0a0b0d]/95 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden w-full">
          <div className="flex flex-col lg:flex-row gap-0 min-h-[380px] lg:min-h-[340px]">
            {/* Left: Info panel */}
            <div className="lg:w-[38%] flex flex-col justify-between p-8 border-b lg:border-b-0 lg:border-r border-white/[0.07]">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-brand/70 font-semibold border border-brand/20 bg-brand/10 px-2 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 leading-tight">{card.name}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{card.description}</p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-brand/60 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive preview</span>
              </div>
            </div>

            {/* Right: Interactive mockup */}
            <div className="lg:flex-1 p-6 flex flex-col" style={{ minHeight: 260 }}>
              <div className="flex-1 relative overflow-hidden">{card.mockup}</div>
            </div>
          </div>
        </div>
      </BorderTrail>
    </div>
  );
}

// ─────────────────────────────────────────────
// Additional feature grid (smaller cards)
// ─────────────────────────────────────────────

const extraFeatures = [
  {
    icon: Files,
    name: 'Multi-File Support',
    description:
      'Reference multiple Excel files in a single query using # mentions. Join data across files naturally.',
  },
  {
    icon: Wand2,
    name: 'AI Data Mutations',
    description:
      "Describe changes in plain English: 'increase column D by 10%'. Preview the exact diff before applying.",
  },
  {
    icon: Bookmark,
    name: 'Saved Queries',
    description:
      'Save your best queries with labels. Reuse them from anywhere and see live results instantly.',
  },
  {
    icon: Lock,
    name: '100% Local & Private',
    description:
      'All data stays on your machine. No telemetry, no cloud sync, no analytics — ever.',
  },
  {
    icon: Users,
    name: 'Multi-User Accounts',
    description:
      'Multiple local user accounts, each with fully isolated data, upload history, and settings.',
  },
  {
    icon: Download,
    name: 'Artifacts & Exports',
    description:
      'Export query results as Excel, charts as PNG or SVG — all stored locally in your artifacts folder.',
  },
  {
    icon: ShieldCheck,
    name: 'Confidence Scoring',
    description:
      'Confidence levels (1–5) accompany every generated query. Low-confidence triggers a warning.',
  },
  {
    icon: GithubIcon,
    name: 'Open Source',
    description:
      'Fully open source on GitHub. Audit the code, contribute improvements, or fork it freely.',
  },
];

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

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

  const scrollItems = featureCards.map((card, i) => (
    <ScrollStackItem
      key={card.name}
      itemClassName="!p-0 !my-6 bg-transparent shadow-none h-auto select-none"
    >
      <FeatureCard card={card} index={i} />
    </ScrollStackItem>
  ));

  return (
    <ClickSpark sparkColor="#8B5CF6" sparkSize={20} sparkRadius={30} sparkCount={9} duration={500}>
      <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white pt-24">
        {/* Global background video */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none opacity-60"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
          />
          <div className="absolute inset-0 bg-[#0c0c0c]/40" />
        </div>

        {/* Root SVG Noise Filter */}
        <svg className="absolute w-0 h-0 pointer-events-none">
          <defs>
            <filter id="c3-noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                stitchTiles="stitch"
              />
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
              <a
                href="#features"
                className="text-white/70 text-xs font-medium hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#gallery"
                className="text-white/70 text-xs font-medium hover:text-white transition-colors"
              >
                Gallery
              </a>
              <Link
                to="/docs"
                className="text-white/70 text-xs font-medium hover:text-white transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Docs
              </Link>
              <a
                href="https://github.com/Manan-2805/SheetMind"
                target="_blank"
                rel="noreferrer"
                className="text-white/70 text-xs font-medium hover:text-white transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                GitHub
              </a>
              <Link
                to="/login"
                className="border border-white/20 rounded-full px-4 py-1 text-xs font-medium text-white hover:bg-white/10 transition-all"
              >
                Get Started
              </Link>
            </div>

            <div className="hidden md:block">
              <AppleButton className="text-xs px-4 py-1.5" />
            </div>

            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </motion.nav>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-4 right-4 z-40 bg-[#0c0c0c]/95 border border-white/10 rounded-2xl backdrop-blur-xl px-6 py-8 flex flex-col gap-6 md:hidden"
            >
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 text-base font-medium hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#gallery"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 text-base font-medium hover:text-white transition-colors"
              >
                Gallery
              </a>
              <Link
                to="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 text-base font-medium hover:text-white transition-colors"
              >
                Documentation
              </Link>
              <a
                href="https://github.com/Manan-2805/SheetMind"
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white/70 text-base font-medium hover:text-white transition-colors"
              >
                GitHub
              </a>
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
        </AnimatePresence>

        {/* SECTION 2 - HERO */}
        <section className="relative z-10 w-full px-6 md:px-16 lg:px-24 md:py-8 lg:py-2 flex flex-col items-center">
          <div className="w-full">
            <BorderTrail
              size={120}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              gradientId="hero-trail"
              className="p-1 border border-white/5 shadow-2xl bg-black/40 backdrop-blur-md"
            >
              <div className="px-6 py-12 md:py-20 rounded-2xl flex flex-col items-center text-center">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/60"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Free & Open Source — No Account Required
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]"
                >
                  Your spreadsheet.
                  <br />
                  <span className="animate-shiny inline-block mt-3" style={gradientStyle}>
                    Revitalized
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                  className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
                >
                  SheetMind is a free, AI-native spreadsheet query platform. Query, analyze, and
                  mutate your Excel files using plain English — powered by local or cloud LLMs.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
                  className="mt-8 flex flex-col items-center gap-3"
                >
                  <AppleButton />
                  <span className="text-xs text-white/40 tracking-wider">
                    Download for Windows / Apple / Linux
                  </span>
                </motion.div>
              </div>
            </BorderTrail>
          </div>
        </section>

        {/* SECTION 3 - macOS MENU BAR STRIP */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="relative z-10 w-full mx-auto mt-4 max-w-6xl h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
        >
          <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 384 512" fill="currentColor" className="w-3.5 h-3.5 text-white">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
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

        {/* SECTION 4 - APPLICATION MOCKUP PLACEHOLDER */}
        <section className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-6 md:py-6 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl shadow-2xl p-2 liquid-glass"
            >
              <div className="w-full h-[520px] rounded-xl bg-gradient-to-br from-[#0e1014] via-[#161a22] to-[#0c0c0c] flex items-center justify-center border border-white/5 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background:
                      'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.18), transparent)',
                  }}
                />
                <div className="text-center z-10 px-4">
                  <LogoMark className="w-16 h-16 text-white mx-auto opacity-70 mb-4 animate-pulse" />
                  <span className="text-sm font-semibold uppercase tracking-widest text-white/50">
                    SheetMind Interface Mockup
                  </span>
                  <p className="text-xs text-white/35 mt-2 max-w-xs mx-auto leading-relaxed">
                    This preview placeholder will be replaced with the original high quality
                    application dashboard screenshot.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 5 - FEATURES (SCROLL STACK) */}
        <section
          id="features"
          className="relative z-10 w-full px-6 md:px-16 lg:px-24 py-16 md:py-24 lg:py-32"
        >
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
                From natural language queries to AI-powered editing — SheetMind transforms how you
                work with Excel data, running entirely locally on your machine.
              </p>
            </motion.div>

            {/* Desktop: Scroll stack with interactive mockups */}
            <div className="hidden md:block">
              <ScrollStack
                className="min-h-[500px]"
                useWindowScroll={true}
                itemDistance={60}
                itemStackDistance={20}
                stackPosition="15%"
                baseScale={0.88}
              >
                {scrollItems}
              </ScrollStack>
            </div>

            {/* Mobile: Simple vertical stack */}
            <div className="md:hidden space-y-6">
              {featureCards.map((card, i) => (
                <FeatureCard key={card.name} card={card} index={i} />
              ))}
            </div>

            {/* Extra features grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {extraFeatures.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.name}
                    className="group liquid-glass rounded-2xl p-5 bg-[#0e1014]/50 border border-white/[0.07] hover:border-white/15 hover:bg-white/[0.03] transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/15 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-brand" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1.5">{f.name}</h4>
                    <p className="text-[11px] text-white/50 leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* SECTION 6 - CIRCULAR GALLERY */}
        <section
          id="gallery"
          className="relative z-10 w-full px-6 md:px-16 lg:px-24 pt-4 pb-16 md:pt-6 md:pb-24 lg:pt-8 lg:pb-32"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center mb-6"
            >
              <SectionEyebrow label="Gallery" />
              <h2 className="mt-6 text-3xl font-bold md:text-5xl text-white">
                See SheetMind in action
              </h2>
              <p className="mt-4 max-w-2xl text-base md:text-lg text-white/60">
                From natural language queries to live dashboards — a visual tour of SheetMind's
                capabilities.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="w-full h-[350px] md:h-[550px]"
            >
              <CircularGallery items={galleryItems} bend={3} />
            </motion.div>
          </div>
        </section>

        {/* SECTION 7 - FINAL CTA */}
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
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      background:
                        'radial-gradient(600px circle at 50% 0%, rgba(255, 255, 255, 0.15), transparent 70%)',
                    }}
                  />

                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.02]">
                    Close the spreadsheets.
                    <br />
                    Query SheetMind.
                  </h2>

                  <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
                    SheetMind is completely free, open-source, and runs entirely offline. Query your
                    spreadsheets with local natural language models — zero cloud dependencies.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <AppleButton label="Download SheetMind" />
                    <a
                      href="https://github.com/Manan-2805/SheetMind"
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-all w-full sm:w-auto"
                    >
                      <GithubIcon className="w-4 h-4" />
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
