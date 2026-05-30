import { motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface BorderTrailProps {
  children: React.ReactNode;
  size?: number;
  transition?: { duration?: number; repeat?: number; ease?: string };
  style?: React.CSSProperties;
  className?: string;
  gradientId?: string;
}

export default function BorderTrail({
  children,
  size = 120,
  transition = { duration: 8 },
  style,
  className = '',
  gradientId = 'trail-gradient',
}: BorderTrailProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;
  const rx = 16;
  const path = `M ${rx} 0 
                H ${width - rx} 
                A ${rx} ${rx} 0 0 1 ${width} ${rx} 
                V ${height - rx} 
                A ${rx} ${rx} 0 0 1 ${width - rx} ${height} 
                H ${rx} 
                A ${rx} ${rx} 0 0 1 0 ${height - rx} 
                V ${rx} 
                A ${rx} ${rx} 0 0 1 ${rx} 0 Z`;

  const pathLength = width * 2 + height * 2;
  const duration = transition?.duration || 8;

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ overflow: 'visible' }}>
      {width > 0 && height > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1, overflow: 'visible', ...style }}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
        >
          <path
            d={path}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1.5"
            className="rounded-2xl"
          />
          <motion.path
            d={path}
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${size} ${pathLength}`}
            animate={{
              strokeDashoffset: [0, -pathLength],
            }}
            transition={{
              duration: duration,
              ease: 'linear',
              repeat: Infinity,
            }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="1" />
              <stop offset="70%" stopColor="#a78bfa" stopOpacity="1" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      )}

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
