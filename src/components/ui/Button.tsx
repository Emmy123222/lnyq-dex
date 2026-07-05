import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'buy' | 'sell' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white',
  secondary: 'bg-[var(--surface-raised)] hover:bg-[var(--ink-600)] text-[var(--text-primary)] border border-[var(--border)]',
  ghost:     'bg-transparent hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  buy:       'bg-[var(--buy)] hover:bg-[var(--buy-hover)] text-white',
  sell:      'bg-[var(--sell)] hover:bg-[var(--sell-hover)] text-white',
  danger:    'bg-[var(--sell)] hover:bg-[var(--sell-hover)] text-white',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-base rounded-[var(--radius-md)]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-bold select-none transition-all duration-[150ms]',
        'btn-press cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-40 cursor-not-allowed' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
