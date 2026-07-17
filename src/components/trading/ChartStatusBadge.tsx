import type { ChartDataStatus } from '../../types/chart'

interface Config { label: string; color: string; dot: 'live' | 'reconnecting' | 'none' }

const STATUS: Record<ChartDataStatus, Config> = {
  loading:      { label: 'Loading',      color: 'var(--text-tertiary)',       dot: 'none' },
  live:         { label: 'Sim·Live',     color: 'var(--chart-up, #00c4b0)',   dot: 'live' },
  delayed:      { label: 'Delayed',      color: '#F0A500',                    dot: 'none' },
  reconnecting: { label: 'Reconnecting', color: '#F0A500',                    dot: 'reconnecting' },
  empty:        { label: 'No trades',    color: 'var(--text-tertiary)',       dot: 'none' },
  unavailable:  { label: 'Unavailable',  color: 'var(--chart-down, #ff4666)', dot: 'none' },
  error:        { label: 'Error',        color: 'var(--chart-down, #ff4666)', dot: 'none' },
}

interface Props { status: ChartDataStatus; compact?: boolean }

export function ChartStatusBadge({ status, compact }: Props) {
  const cfg = STATUS[status]
  return (
    <span style={{
      display:     'inline-flex',
      alignItems:  'center',
      gap:         4,
      padding:     compact ? '2px 6px' : '3px 8px',
      borderRadius: 99,
      fontSize:    10,
      fontWeight:  700,
      letterSpacing: '0.04em',
      background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
      border:     `1px solid color-mix(in srgb, ${cfg.color} 28%, transparent)`,
      color:       cfg.color,
      whiteSpace:  'nowrap',
    }}>
      {cfg.dot !== 'none' && (
        <span
          className={cfg.dot === 'live' ? 'chart-dot-live' : 'chart-dot-reconnecting'}
          style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }}
        />
      )}
      {cfg.label}
    </span>
  )
}
