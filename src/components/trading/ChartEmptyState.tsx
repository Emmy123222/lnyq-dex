interface Props { message?: string }

export function ChartEmptyState({ message = 'No trades yet' }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10, zIndex: 10,
      background: 'var(--surface-1)',
    }}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3"  y="12" width="5" height="10" rx="1" />
        <line x1="5.5" y1="8"  x2="5.5" y2="12" />
        <line x1="5.5" y1="22" x2="5.5" y2="27" />
        <rect x="14" y="7" width="5"  height="12" rx="1" />
        <line x1="16.5" y1="3" x2="16.5" y2="7" />
        <line x1="16.5" y1="19" x2="16.5" y2="24" />
        <rect x="24" y="14" width="5"  height="8" rx="1" />
        <line x1="26.5" y1="10" x2="26.5" y2="14" />
        <line x1="26.5" y1="22" x2="26.5" y2="27" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {message}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          Candles will appear once trading begins
        </div>
      </div>
    </div>
  )
}
