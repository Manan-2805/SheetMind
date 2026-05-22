import { Image as ImageIcon } from 'lucide-react'

interface ImagePlaceholderProps {
  label: string
  aspectRatio?: string
}

export default function ImagePlaceholder({ label, aspectRatio = '16/9' }: ImagePlaceholderProps) {
  return (
    <div
      className="w-full my-8 flex flex-col items-center justify-center"
      style={{
        aspectRatio,
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <ImageIcon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
      <span
        className="mt-3 text-xs"
        style={{
          color: 'var(--color-text-tertiary)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {label}
      </span>
    </div>
  )
}
