import React, { useEffect, useRef, useState } from 'react';

import { motion, useSpring } from 'framer-motion';

interface GalleryItem {
  image: string;
  text: string;
}

interface CircularGalleryProps {
  items: GalleryItem[];
  bend?: number;
  height?: number | string;
}

export default function CircularGallery({
  items,
  bend = 3,
  height = 500,
}: CircularGalleryProps) {
  const [activeRotation, setActiveRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startRotation = useRef(0);

  const rotationSpring = useSpring(0, {
    stiffness: 60,
    damping: 20,
  });

  useEffect(() => {
    rotationSpring.set(activeRotation);
  }, [activeRotation, rotationSpring]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startRotation.current = activeRotation;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startX.current;
    const rotateAmount = deltaX * 0.4;
    setActiveRotation(startRotation.current + rotateAmount);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    startRotation.current = activeRotation;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.touches[0].clientX - startX.current;
    const rotateAmount = deltaX * 0.4;
    setActiveRotation(startRotation.current + rotateAmount);
  };

  const radius = 240;

  return (
    <div
      ref={containerRef}
      className="relative select-none cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center"
      style={{ height, perspective: '1000px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <motion.div
        className="relative w-48 h-64"
        style={{
          transformStyle: 'preserve-3d',
          rotateY: rotationSpring,
        }}
      >
        {items.map((item, index) => {
          const angle = (index * 360) / items.length;
          const bendAngle = bend;

          return (
            <div
              key={index}
              className="absolute inset-0 rounded-xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-md shadow-2xl p-2 liquid-glass flex flex-col justify-between"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px) rotateX(${bendAngle}deg)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <div className="w-full h-[75%] rounded-lg overflow-hidden bg-black/40">
                <img
                  src={item.image}
                  alt={item.text}
                  draggable="false"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-[20%] flex items-center justify-center text-center px-1">
                <span className="text-[11px] font-semibold text-white/80 tracking-wide uppercase truncate w-full">
                  {item.text}
                </span>
              </div>
            </div>
          );
        })}
      </motion.div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/30 font-medium tracking-widest uppercase">
        Drag or swipe to rotate
      </div>
    </div>
  );
}
