import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ServerErrorPage() {
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
        className="relative z-10 w-full max-w-[460px] p-10 md:p-12 liquid-glass border border-white/10 bg-[#0e1014]/65 backdrop-blur-2xl text-white shadow-2xl rounded-3xl flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-[90px] md:text-[110px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand to-[#a78bfa]">
          500
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-white tracking-tight">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-white/60 leading-relaxed">
          We encountered an unexpected error on our end. Please try again.
        </p>
        <div className="mt-8 flex gap-4 w-full">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 rounded-full py-2.5 text-sm font-medium bg-brand hover:bg-brand/90 text-white transition-all text-center"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="flex-1 rounded-full py-2.5 text-sm font-medium border border-white/10 hover:bg-white/5 text-white/80 transition-all text-center"
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
