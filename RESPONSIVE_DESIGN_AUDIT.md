# Responsive Design Audit

**Date:** 2026-07-18

---

## Breakpoints Used

| Name | Range | Layout strategy |
|------|-------|----------------|
| mobile | < 640px | Bottom nav, chart first, order book/entry as tabs, cards instead of tables |
| tablet | 640px–1023px | Collapsible sidebar, stacked panels, tabs for dense sections |
| laptop | 1024px–1279px | Left sidebar, chart + panels side by side |
| desktop | 1280px–1535px | Full trading workspace, all panels visible |
| wide | ≥ 1536px | Same as desktop, wider content areas |

---

## App Shell (`src/components/layout/AppShell.tsx`)

| Screen | Behavior |
|--------|----------|
| Desktop (≥1024px) | Persistent left sidebar, main content fills remaining width |
| Tablet (640–1023px) | Sidebar collapses, top nav or hamburger |
| Mobile (<640px) | No sidebar, bottom navigation bar, full-width content |

**Current status (updated 2026-07-18):** `MobileNav.tsx` is implemented — 5-tab fixed bottom bar at `position: fixed; bottom: 0`. `AppShell` renders it conditionally via `{isMobile && <MobileNav />}` (using `useIsMobile(768)` hook), so it is absent from the DOM on desktop entirely. Safe-area-inset-bottom padding applied both in MobileNav and AppShell `<main>`. P1 gap resolved.

---

## TradePage Layout

### Desktop (≥1280px)
```
┌─────────────────────────────────────────────────────┐
│ Market Header (full width)                          │
├─────────────────────┬────────────────┬──────────────┤
│                     │                │              │
│  Chart (flex: 1)    │  Order Book    │  Order Entry │
│                     │  (w: 280px)    │  (w: 320px)  │
│                     │                │              │
│                     ├────────────────┤              │
│                     │  Recent Trades │              │
│                     │                │              │
├─────────────────────┴────────────────┴──────────────┤
│ Positions / Open Orders / Order History (full width) │
└─────────────────────────────────────────────────────┘
```

### Tablet (640–1023px)
```
┌──────────────────────────┐
│ Market Header            │
├──────────────────────────┤
│ Chart (full width)       │
├──────────────────────────┤
│ [Book] [Trades] [Entry]  │  ← tabs
│ (active tab content)     │
├──────────────────────────┤
│ [Positions] [Orders]     │  ← tabs
└──────────────────────────┘
```

### Mobile (<640px)
```
┌──────────────────────┐
│ Market Header (compact)│
├──────────────────────┤
│ Chart                │
├──────────────────────┤
│ [Book][Trades][Orders]│  ← tabs
├──────────────────────┤
│ [Buy] [Sell]         │  ← sticky CTA
└──────────────────────┘
  Order entry = bottom sheet
```

**Current gap:** TradePage currently uses fixed desktop grid with no mobile tab switching. Mobile users may see horizontal overflow.

---

## Portfolio Page

### Desktop
- Left panel: Account equity card (fixed width ~360px)
- Right panel: Account value chart (flex: 1)
- Bottom: Positions / Open Orders / History tabs (full width)
- Bottom: Balances table

### Mobile
- Equity card collapses to summary row
- Chart hidden or shown in separate tab
- Positions/Orders as cards (not grid rows)
- Large tap targets on Cancel/Close buttons

**Current gap:** Uses `flex` layout with `flex: '0 0 360px'` which breaks on narrow screens. Needs `@media (max-width: 768px)` override.

---

## Leaderboard Page

### Desktop
- Full-width table with 3 columns (Rank, Trader, Points)

### Mobile
- Same 3-column table — scales reasonably
- Rank + avatar card layout if table overflows

**Current status:** Acceptable at current column count.

---

## MarketDetail Page

### Desktop
- Hero header with live price
- Stat strip (7 columns)
- Chart (flex: 1) + About panel + Top Holders panel

### Mobile
- Stat strip scrolls horizontally
- Chart below header
- About + Top Holders stack vertically

**Current gap:** Stat strip uses fixed 7 columns which will overflow on <640px. Needs `overflow-x: auto` wrapper.

---

## Auth Flow

### All breakpoints
- Single-column card layout
- `maxWidth: 392px`, centered
- Works at 375px minimum width

**Status: Good** — no issues.

---

## Analytics / Alerts / Rewards

All replaced with simpler layouts:
- Analytics: Two-panel flex — collapses gracefully
- Alerts: Side-by-side panels — right panel needs to stack on mobile (<768px)
- Rewards: Two-column flex — right column needs to stack on mobile

---

## Vaults / Stake / Earn

"Coming Soon" centered pages — single element, works at all widths.

---

## Global Rules Applied

| Rule | Status |
|------|--------|
| No fixed desktop-only widths | Partial — some `flex: '0 0 420px'` panels exist |
| No overflowing tables | Partial — stat strips need scroll wrappers |
| No clipped panels | ✓ All panels use `overflow: hidden` or `overflow-y: auto` |
| Monospace numbers readable at 12px | ✓ |
| Tap targets ≥ 44px height | ✓ Buttons use `height: 42px` minimum |
| No layout breaking below 375px | Partial — need explicit 375px viewport testing |
| Mobile-first CSS | Partial — current CSS is desktop-first inline styles |

---

## Known Gaps (Backlog)

| Priority | Gap | Files Affected | Status |
|----------|-----|----------------|--------|
| P1 | TradePage has no mobile tab system for Order Book / Trades / Entry | `TradePage.tsx` | Open |
| ~~P1~~ | ~~Bottom navigation bar missing on mobile~~ | `AppShell.tsx`, `MobileNav.tsx` | **Done** — `useIsMobile` + conditional render |
| P2 | Portfolio equity+chart row doesn't stack on narrow screens (`flex: '0 0 360px'`) | `Portfolio.tsx` | Open |
| P2 | Stat strips overflow horizontally on mobile | `TradePage.tsx`, `MarketDetail.tsx` | Open |
| P2 | Alerts side-by-side panels don't stack on mobile | `Alerts.tsx` | Open |
| P2 | Rewards side-by-side panels don't stack on mobile | `Rewards.tsx` | Open |
| P3 | Order entry should open as bottom sheet on mobile | `TradePage.tsx` | Open |
| P3 | Table rows should convert to cards on mobile | `Portfolio.tsx`, `TradePage.tsx` | Open |
