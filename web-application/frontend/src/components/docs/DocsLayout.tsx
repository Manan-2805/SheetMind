import { useState } from 'react';

import { Menu, Search, X } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

import ClickSpark from '@/components/common/ClickSpark';
import DocsSidebar from '@/components/docs/DocsSidebar';

export default function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ClickSpark
      sparkColor="#8B5CF6"
      sparkSize={20}
      sparkRadius={30}
      sparkCount={9}
      duration={500}
    >
      <div className="relative min-h-screen bg-[#0c0c0c] text-white flex flex-col">
        
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

        {/* Sticky Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-6 bg-black/40 backdrop-blur-md border-b border-white/10 relative">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-white/80 hover:text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-5 w-5 rounded bg-brand flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
              <span className="text-sm font-bold text-white tracking-wide">
                SheetMind
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md max-w-[260px] flex-1 mx-8 bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-text">
            <Search size={14} className="text-white/40" />
            <span className="text-xs flex-1 text-white/40">
              Search docs...
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/40">
              Cmd+K
            </span>
          </div>

          <Link
            to="/"
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Back to App
          </Link>
        </header>

        {/* Body content with sidebar and glassy pages */}
        <div className="flex flex-1 relative z-10">
          
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
            <DocsSidebar />
          </aside>

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="fixed left-0 top-14 z-30 w-[280px] h-[calc(100vh-56px)] overflow-y-auto lg:hidden">
                <DocsSidebar onClose={() => setSidebarOpen(false)} />
              </aside>
            </>
          )}

          {/* Main Outlet Container with Liquid Glass layout card */}
          <main className="flex-1 min-w-0 px-4 py-8 md:px-8 overflow-y-auto h-[calc(100vh-56px)]">
            <div className="max-w-4xl mx-auto liquid-glass rounded-2xl p-6 md:p-10 border border-white/10 bg-[#0e1014]/65 backdrop-blur-2xl shadow-2xl">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </ClickSpark>
  );
}
