import React from 'react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  hint?: string
  error?: string
  suffix?: React.ReactNode
  prefix?: React.ReactNode
}

export default function Input({
  label,
  hint,
  error,
  suffix,
  prefix,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-[var(--text-tertiary)] text-sm pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          className={[
            'w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-[var(--radius-md)]',
            'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]',
            'h-10 px-3 transition-all duration-[150ms]',
            'hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:outline-none',
            'focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0',
            error ? 'border-[var(--sell)]' : '',
            prefix ? 'pl-8' : '',
            suffix ? 'pr-12' : '',
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-[var(--text-tertiary)] text-sm pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-[var(--sell)] animate-[fadeIn_200ms_ease]">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>
      )}
    </div>
  )
}
