import React, { useEffect } from 'react'
import { IconX } from '@tabler/icons-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg'
}

const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export default function Modal({ open, onClose, title, children, width = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={[
          'relative w-full bg-[var(--surface-1)] border border-[var(--border-strong)]',
          'rounded-[var(--radius-xl)] shadow-[var(--shadow-pop)] modal-in',
          widths[width],
        ].join(' ')}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <IconX size={18} />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
