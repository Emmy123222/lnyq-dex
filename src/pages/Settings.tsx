import { useState } from 'react'

const RAIL_ITEMS = [
  { label: 'Profile',              danger: false },
  { label: 'Account & Security',   danger: false },
  { label: 'API Keys',             danger: false },
  { label: 'Notifications',        danger: false },
  { label: 'Preferences',          danger: false },
  { label: 'Danger Zone',          danger: true  },
]

const NOTIF_ITEMS = [
  { label: 'Order Filled',         desc: 'When your order is fully executed.',     on: true  },
  { label: 'Partial Fill',         desc: 'When your order is partially filled.',   on: true  },
  { label: 'Order Cancelled',      desc: 'When an order is cancelled.',            on: false },
  { label: 'Liquidation Warning',  desc: 'When margin ratio approaches limit.',    on: true  },
  { label: 'Funding Rate',         desc: 'Funding rate settlement notifications.', on: false },
]

const API_KEYS = [
  { name: 'trading-bot',  perms: 'Read, Trade', created: '2026-06-01', used: '2026-07-05', status: 'Active'  },
  { name: 'analytics',    perms: 'Read',         created: '2026-05-12', used: '2026-07-03', status: 'Active'  },
  { name: 'old-script',   perms: 'Read, Trade', created: '2026-03-20', used: '2026-04-10', status: 'Revoked' },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 999, padding: 3, cursor: 'pointer', border: 'none', transition: 'background 150ms',
        background: on ? 'var(--accent)' : 'var(--surface-3)',
        display: 'flex', alignItems: 'center',
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'transform 150ms', transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  )
}

export default function Settings() {
  const [section, setSection] = useState('Profile')
  const [notifs, setNotifs] = useState(NOTIF_ITEMS.map(n => n.on))
  const [twoFa, setTwoFa] = useState(false)
  const [confirmOrder, setConfirmOrder] = useState(true)

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--topbar-h))' }}>

      {/* Left rail */}
      <div style={{ flex: '0 0 248px', borderRight: '1px solid var(--border-subtle)', padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', padding: '0 10px', marginBottom: 18, display: 'block' }}>Settings</span>
        {RAIL_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => setSection(item.label)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, width: '100%', textAlign: 'left',
              background: section === item.label ? 'var(--accent-tint)' : 'transparent',
              border: 'none', cursor: 'pointer',
              color: item.danger ? 'var(--down-400)' : section === item.label ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: 13, fontWeight: 700,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 22, overflowY: 'auto' }}>

        {/* Profile */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 22 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 18 }}>Profile</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
            <span style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#A051FC,#531C97)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              TM
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={{ height: 30, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Change avatar
              </button>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>PNG or JPG, max 2MB. Or use your initials.</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {[
              { label: 'Username',     value: 'tunmise' },
              { label: 'Display Name', value: 'Tunmise'  },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{f.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{f.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account & Security */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 22 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 18 }}>Account &amp; Security</span>
          {[
            {
              title: 'Email', sub: 'tunmise@lnyq.xyz',
              right: <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(46,189,133,0.14)', color: 'var(--up-500)', border: '1px solid rgba(46,189,133,0.3)' }}>Verified</span>
            },
            {
              title: 'Embedded Wallet', sub: '0x7a1f…c3b2 · self-custodial',
              right: <button style={{ height: 30, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Export</button>
            },
            {
              title: 'Two-Factor Authentication', sub: 'Require a code on each new device.',
              right: <Toggle on={twoFa} onChange={setTwoFa} />
            },
          ].map((row, i, arr) => (
            <div key={row.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{row.title}</div>
                <div style={{ fontSize: 12, fontFamily: row.title === 'Embedded Wallet' ? 'var(--font-mono)' : undefined, color: 'var(--text-tertiary)', marginTop: 2 }}>{row.sub}</div>
              </div>
              {row.right}
            </div>
          ))}
        </div>

        {/* API Keys */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>API Keys</span>
            <button style={{ height: 30, padding: '0 12px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Create API Key</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 1fr 0.9fr 0.7fr', padding: '8px 4px', borderBottom: '1px solid var(--border-subtle)' }}>
            {['Name', 'Permissions', 'Created', 'Last Used', 'Status', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{h}</span>
            ))}
          </div>
          {API_KEYS.map(k => (
            <div key={k.name} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr 1fr 0.9fr 0.7fr', padding: '13px 4px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{k.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{k.perms}</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{k.created}</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{k.used}</span>
              <span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: k.status === 'Active' ? 'rgba(46,189,133,0.14)' : 'rgba(255,255,255,0.06)', color: k.status === 'Active' ? 'var(--up-500)' : 'var(--text-tertiary)', border: `1px solid ${k.status === 'Active' ? 'rgba(46,189,133,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                  {k.status}
                </span>
              </span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {k.status === 'Active' && (
                  <button style={{ padding: '3px 8px', fontSize: 11, fontWeight: 700, color: 'var(--down-400)', background: 'rgba(246,70,93,0.12)', border: '1px solid rgba(246,70,93,0.3)', borderRadius: 4, cursor: 'pointer' }}>Revoke</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notifications + Preferences */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 22 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 8 }}>Notifications</span>
            {NOTIF_ITEMS.map((n, i) => (
              <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < NOTIF_ITEMS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{n.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{n.desc}</div>
                </div>
                <Toggle on={notifs[i]} onChange={v => setNotifs(prev => prev.map((x, j) => j === i ? v : x))} />
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Preferences</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Timezone</span>
              <select style={{ height: 38, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                <option>UTC</option>
                <option>UTC+1</option>
                <option>UTC-5</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>Default Order Size Unit</span>
              <select style={{ height: 38, padding: '0 12px', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                <option>NFTs</option>
                <option>USDC</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Confirm before order</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Show a confirmation modal.</div>
              </div>
              <Toggle on={confirmOrder} onChange={setConfirmOrder} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
