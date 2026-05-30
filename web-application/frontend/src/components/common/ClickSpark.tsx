import type React from 'react';
import { useEffect, useRef } from 'react';

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: string;
  extraScale?: number;
  children?: React.ReactNode;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  distance: number;
  maxDistance: number;
  size: number;
  alpha: number;
  startTime: number;
}

export default function ClickSpark({
  sparkColor = '#8B5CF6',
  sparkSize = 20,
  sparkRadius = 30,
  sparkCount = 9,
  duration = 500,
  easing = 'ease-out',
  extraScale = 1.0,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const animate = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sparks = sparksRef.current;
    const remainingSparks: Spark[] = [];

    for (let i = 0; i < sparks.length; i++) {
      const spark = sparks[i];
      const elapsed = timestamp - spark.startTime;
      const progress = Math.min(elapsed / duration, 1);

      let easeProgress = progress;
      if (easing === 'ease-out') {
        easeProgress = 1 - (1 - progress) ** 2;
      } else if (easing === 'ease-in-out') {
        easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
      }

      spark.distance = easeProgress * spark.maxDistance * extraScale;
      spark.alpha = 1 - easeProgress;

      if (progress < 1) {
        remainingSparks.push(spark);

        const currentX = spark.x + Math.cos(spark.angle) * spark.distance;
        const currentY = spark.y + Math.sin(spark.angle) * spark.distance;

        const tailX = spark.x + Math.cos(spark.angle) * Math.max(0, spark.distance - spark.size);
        const tailY = spark.y + Math.sin(spark.angle) * Math.max(0, spark.distance - spark.size);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = spark.alpha;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
      }
    }

    sparksRef.current = remainingSparks;

    if (remainingSparks.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      animationFrameRef.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSparks: Spark[] = [];
    const startTime = performance.now();

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i * 2 * Math.PI) / sparkCount + (Math.random() - 0.5) * 0.5;
      const maxDistance = sparkRadius * (0.8 + Math.random() * 0.4);
      const size = sparkSize * (0.7 + Math.random() * 0.6);

      newSparks.push({
        x,
        y,
        angle,
        distance: 0,
        maxDistance,
        size,
        alpha: 1,
        startTime,
      });
    }

    sparksRef.current = [...sparksRef.current, ...newSparks];

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} onMouseDown={handleMouseDown} className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50 w-full h-full" />
      {children}
    </div>
  );
}
