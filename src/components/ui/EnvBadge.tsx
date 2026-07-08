/**
 * EnvBadge — persistent mode indicator in the topbar.
 * Never shown in production.
 */

import { ENV } from '../../config/env'

export default function EnvBadge() {
  if (ENV.IS_PRODUCTION) return null

  const label = ENV.IS_LOCAL_API
    ? 'Local API'
    : ENV.IS_DEVNET_API
      ? 'Devnet API'
      : ENV.IS_STAGING
        ? 'Staging'
        : 'Unknown'

  const color = ENV.IS_LOCAL_API
    ? '#7B61FF'   // purple — local backend, real CLOB
    : ENV.IS_DEVNET_API
      ? '#F0A500'   // amber — real devnet API
      : '#2EBD85'   // green — staging

  const title = ENV.IS_LOCAL_API
    ? 'Local API — real CLOB matching, PostgreSQL, no onchain settlement'
    : ENV.IS_DEVNET_API
      ? 'Devnet API — connected to test backend'
      : 'Staging API — connected to staging environment'

  return (
    <div
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 4,
        border: `1px solid ${color}33`,
        background: `${color}15`,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.06em',
        color,
        userSelect: 'none',
        cursor: 'default',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          animation: ENV.IS_LOCAL_API ? 'pulse 2s infinite' : 'none',
        }}
      />
      {label.toUpperCase()}
    </div>
  )
}
