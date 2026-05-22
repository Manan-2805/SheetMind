import type { ReactNode } from 'react'

import { AlertCircle, Info, Lightbulb } from 'lucide-react'

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip'
  children: ReactNode
}

const calloutStyles = {
  info: { borderColor: 'var(--color-primary)', icon: Info, iconColor: 'var(--color-primary-light)' },
  warning: { borderColor: 'var(--color-warning)', icon: AlertCircle, iconColor: 'var(--color-warning)' },
  tip: { borderColor: 'var(--color-success)', icon: Lightbulb, iconColor: 'var(--color-success)' },
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const style = calloutStyles[type]
  const Icon = style.icon

  return (
    <div
      className="flex gap-3 p-4 my-4"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderLeft: `3px solid ${style.borderColor}`,
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
      }}
    >
      <Icon size={18} className="mt-0.5 flex-shrink-0" style={{ color: style.iconColor }} />
      <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {children}
      </div>
    </div>
  )
}

export function DocH1({ children }: { children: ReactNode }) {
  return (
    <h1
      className="text-4xl font-extrabold mb-2 pb-4"
      style={{
        color: 'var(--color-text-primary)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {children}
    </h1>
  )
}

export function DocH2({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-2xl font-bold mt-12 mb-4"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {children}
    </h2>
  )
}

export function DocH3({ children }: { children: ReactNode }) {
  return (
    <h3
      className="text-xl font-semibold mt-8 mb-3"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {children}
    </h3>
  )
}

export function DocP({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[15px] leading-7 mb-4"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {children}
    </p>
  )
}

export function DocCode({ children }: { children: ReactNode }) {
  return (
    <code
      className="text-[13px] px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-primary-light)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {children}
    </code>
  )
}

export function DocPre({ children }: { children: ReactNode }) {
  return (
    <pre
      className="overflow-x-auto p-5 mb-6 text-sm"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </pre>
  )
}

export function DocUl({ children }: { children: ReactNode }) {
  return (
    <ul className="mb-4 pl-5 list-disc" style={{ color: 'var(--color-text-secondary)' }}>
      {children}
    </ul>
  )
}

export function DocOl({ children }: { children: ReactNode }) {
  return (
    <ol className="mb-4 pl-5 list-decimal" style={{ color: 'var(--color-text-secondary)' }}>
      {children}
    </ol>
  )
}

export function DocLi({ children }: { children: ReactNode }) {
  return (
    <li className="leading-7 mb-1.5 text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
      {children}
    </li>
  )
}

export function DocBlockquote({ children }: { children: ReactNode }) {
  return (
    <blockquote
      className="p-4 mb-4"
      style={{
        borderLeft: '3px solid var(--color-primary)',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
      }}
    >
      {children}
    </blockquote>
  )
}

export function DocTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}

export function DocTh({ children }: { children: ReactNode }) {
  return (
    <th
      className="text-left text-[13px] font-semibold uppercase tracking-wide px-3 py-2"
      style={{
        color: 'var(--color-text-tertiary)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {children}
    </th>
  )
}

export function DocTd({ children }: { children: ReactNode }) {
  return (
    <td
      className="text-sm px-3 py-2.5"
      style={{
        color: 'var(--color-text-secondary)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {children}
    </td>
  )
}

export function DocHr() {
  return <hr className="my-10" style={{ borderColor: 'var(--color-border)' }} />
}
