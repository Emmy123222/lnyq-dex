interface Props { message: string; onRetry: () => void }

export function ChartErrorState({ message, onRetry }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 12, zIndex: 10,
      background: 'var(--surface-1)',
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--chart-down, #ff4666)" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <circle cx="12" cy="16" r="0.6" fill="var(--chart-down, #ff4666)" stroke="none" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Chart unavailable
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12, maxWidth: 260 }}>
          {message}
        </div>
        <button
          onClick={onRetry}
          style={{
            fontSize: 12, fontWeight: 700,
            color: 'var(--accent)',
            background: 'rgba(160,81,252,0.12)',
            border: '1px solid rgba(160,81,252,0.3)',
            borderRadius: 6, padding: '5px 16px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    </div>
  )
}
