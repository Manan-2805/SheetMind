interface SectionBadgeProps {
  text: string;
}

export default function SectionBadge({ text }: SectionBadgeProps) {
  return (
    <span
      className="inline-block rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
      style={{
        backgroundColor: 'var(--color-primary-glow)',
        color: 'var(--color-primary-light)',
        border: '1px solid rgba(124, 58, 237, 0.3)',
      }}
    >
      {text}
    </span>
  );
}
