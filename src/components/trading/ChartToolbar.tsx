import type { ChartMode, CandleInterval, ChartIndicators } from '../../types/chart'

const TIMEFRAMES: CandleInterval[] = ['1m', '5m', '15m', '1h', '4h', '1D']
const MODES: { id: ChartMode; label: string }[] = [
  { id: 'candles', label: 'Candles' },
  { id: 'area',    label: 'Area' },
  { id: 'line',    label: 'Line' },
]
const INDICATORS: { key: keyof ChartIndicators; label: string }[] = [
  { key: 'volume',   label: 'Vol' },
  { key: 'midpoint', label: 'Mid' },
  { key: 'bidAsk',   label: 'Bid/Ask' },
]

interface Props {
  mode:               ChartMode
  interval:           CandleInterval
  indicators:         ChartIndicators
  onModeChange:       (m: ChartMode) => void
  onIntervalChange:   (i: CandleInterval) => void
  onIndicatorsChange: (patch: Partial<ChartIndicators>) => void
  compact?:           boolean
}

export function ChartToolbar({
  mode, interval, indicators,
  onModeChange, onIntervalChange, onIndicatorsChange, compact,
}: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
      padding: compact ? '7px 12px' : '7px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      {/* Mode group */}
      <div style={{ display: 'flex', gap: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 2 }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`chart-pill${mode === m.id ? ' chart-pill-active' : ''}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      {/* Timeframe group */}
      <div style={{ display: 'flex', gap: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 2 }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => onIntervalChange(tf)}
            className={`chart-pill${interval === tf ? ' chart-pill-active' : ''}`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0 }} />

      {/* Indicator toggles — hidden on very small */}
      {!compact && (
        <div style={{ display: 'flex', gap: 4 }}>
          {INDICATORS.map(ind => (
            <button
              key={ind.key}
              onClick={() => onIndicatorsChange({ [ind.key]: !indicators[ind.key] })}
              className={`chart-pill-indicator${indicators[ind.key] ? ' chart-pill-indicator-active' : ''}`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
