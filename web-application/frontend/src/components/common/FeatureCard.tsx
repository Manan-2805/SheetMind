import type { LucideIcon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface FeatureCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, name, description }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (-y / rect.height) * 8;
    const rotateY = (x / rect.width) * 8;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('');
  }, []);

  return (
    <div
      ref={cardRef}
      className="p-6 transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        transform: transform || 'perspective(1000px) rotateX(0) rotateY(0)',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--color-primary-glow)' }}
      >
        <Icon size={24} style={{ color: 'var(--color-primary-light)' }} />
      </div>
      <h3 className="mt-4 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
    </div>
  );
}
