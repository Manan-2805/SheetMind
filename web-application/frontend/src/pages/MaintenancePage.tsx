import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
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
        <Wrench
          size={56}
          className="animate-[spin_8s_linear_infinite] text-brand"
          style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))' }}
        />
        <h1 className="mt-6 text-2xl font-bold text-white tracking-tight">Under Maintenance</h1>
        <p className="mt-3 text-sm text-white/60 leading-relaxed">
          We're making some improvements to SheetMind. We will be back shortly.
        </p>
        <p className="mt-6 text-xs text-white/40 tracking-wide uppercase font-semibold">
          Thank you for your patience
        </p>
      </motion.div>
    </div>
  );
}
