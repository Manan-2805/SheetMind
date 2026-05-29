import React, { useRef } from 'react';

import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollStackProps {
  items: React.ReactNode[];
  minHeight?: string;
}

export default function ScrollStack({ items, minHeight = '600px' }: ScrollStackProps) {
  return (
    <div className="relative w-full flex flex-col gap-16 py-12" style={{ minHeight }}>
      {items.map((item, index) => (
        <ScrollStackCard key={index} index={index} total={items.length}>
          {item}
        </ScrollStackCard>
      ))}
    </div>
  );
}

function ScrollStackCard({
  children,
  index,
  total,
}: {
  children: React.ReactNode;
  index: number;
  total: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92 - (total - index - 1) * 0.01]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.7]);

  return (
    <div
      ref={containerRef}
      className="sticky top-24 w-full flex justify-center pb-8"
      style={{
        zIndex: index + 10,
      }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          transformOrigin: 'top center',
        }}
        className="w-full max-w-4xl"
      >
        {children}
      </motion.div>
    </div>
  );
}
