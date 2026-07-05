import React from 'react'

type BadgeVariant = 'default' | 'buy' | 'sell' | 'warn' | 'accent' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-raised)] text-[var(--text-secondary)]',
  buy:     'bg-[var(--buy-bg)] text-[var(--buy)]',
  sell:    'bg-[var(--sell-bg)] text-[var(--sell)]',
  warn:    'bg-[var(--warn-bg)] text-[var(--warn)]',
  accent:  'bg-[var(--accent-tint)] text-[var(--text-accent)]',
  neutral: 'bg-[var(--surface-2)] text-[var(--text-tertiary)]',
}

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wide',
        styles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
