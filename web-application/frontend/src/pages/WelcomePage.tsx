import { motion } from 'framer-motion';
import { BookOpen, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

export default function WelcomePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0c0c0c] text-white px-6">
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

      <motion.div
        className="relative z-10 w-full max-w-2xl p-10 md:p-12 liquid-glass border border-white/10 bg-[#0e1014]/65 backdrop-blur-2xl text-white shadow-2xl rounded-3xl flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="h-20 w-20 rounded-full object-cover border-2 border-brand"
            style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white bg-brand"
            style={{ boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}
          >
            {initials}
          </div>
        )}

        <p className="mt-6 text-base text-white/60">Welcome back,</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">{user.name}</h1>
        <p className="mt-1 text-sm text-white/40">{user.email}</p>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6 w-full">
          <div className="flex-1 p-6 flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <Download size={32} className="text-brand-light text-brand" />
            <h3 className="mt-4 text-base font-semibold text-white">Download SheetMind</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/50">
              The desktop application is coming soon. We'll notify you when it's available.
            </p>
            <div className="relative group w-full mt-6">
              <button
                className="w-full rounded-full py-2.5 text-sm font-medium border border-white/10 text-white/40 cursor-not-allowed opacity-50"
                disabled
              >
                Notify Me
              </button>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-[#0e1014] border border-white/10 text-white/60">
                Coming Soon
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <BookOpen size={32} className="text-brand-light text-brand" />
            <h3 className="mt-4 text-base font-semibold text-white">Read the Docs</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/50">
              Learn how to use every feature of SheetMind with step-by-step guides.
            </p>
            <Link
              to="/docs"
              className="w-full mt-6 rounded-full py-2.5 text-sm font-medium bg-brand hover:bg-brand/90 transition-all text-white text-center block"
            >
              Open Documentation &rarr;
            </Link>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-8 text-sm text-white/40 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
