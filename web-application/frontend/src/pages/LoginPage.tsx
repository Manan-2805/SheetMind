import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const LogoMark = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="#ffffff" className={className}>
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGoogleLogin = async () => {
    setIsConnecting(true);
    try {
      const response = await api.get('/auth/google');
      if (response.data?.success && response.data?.data?.auth_url) {
        window.location.href = response.data.data.auth_url;
      }
    } catch {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0c0c0c] text-white">
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
        className="relative z-10 w-full max-w-[440px] mx-4 p-12 liquid-glass border border-white/10 bg-[#0e1014]/65 backdrop-blur-2xl text-white shadow-2xl rounded-3xl"
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <LogoMark className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold tracking-tight text-white">SheetMind</span>
          </div>

          <h1 className="mt-8 text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-center text-white/60">
            Sign in to access your SheetMind account and documentation.
          </p>

          <button
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full h-11 text-sm font-medium transition-all bg-white text-black hover:bg-white/90 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed"
            onClick={handleGoogleLogin}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <Link to="/" className="mt-8 text-sm text-white/60 hover:text-white transition-colors">
            &larr; Back to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
