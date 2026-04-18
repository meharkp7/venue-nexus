import React from 'react'
import { TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react'

const TREND_ICON = {
  rising:  { Icon: TrendingUp, color: 'var(--accent-danger)' },
  falling: { Icon: TrendingDown, color: 'var(--accent-success)' },
  stable:  { Icon: Minus, color: 'var(--text-muted)' },
}

export default function ForecastPanel({ forecasts = [] }) {
  // Show only non-trivial forecasts (density > 20% or rising)
  const interesting = forecasts
    .filter(f => f.current_density > 0.15 || f.trend === 'rising')
    .sort((a, b) => b.forecast_15min - a.forecast_15min)
    .slice(0, 8)

  return (
    <div style={styles.wrap} className="card">
      <div style={styles.header}>
        <Eye size={12} color="var(--text-muted)" />
        <span style={styles.title}>SHORT-TERM FORECAST</span>
        <span style={styles.badge}>{forecasts.length} nodes</span>
      </div>

      <div style={styles.colHeaders}>
        <span style={styles.colLabel}>NODE</span>
        <span style={styles.colLabel}>NOW</span>
        <span style={styles.colLabel}>5m</span>
        <span style={styles.colLabel}>15m</span>
        <span style={styles.colLabel}>30m</span>
        <span style={styles.colLabel}>CONF</span>
        <span style={styles.colLabel}>UNC</span>
      </div>

      <div style={styles.list}>
        {interesting.length === 0 ? (
          <div style={styles.empty}>No significant forecasts</div>
        ) : (
          interesting.map((f, i) => {
            const trend = TREND_ICON[f.trend] || TREND_ICON.stable
            const { Icon } = trend
            return (
              <div key={i} style={styles.row} className="fade-in">
                <div style={styles.nameCell}>
                  <Icon size={10} color={trend.color} />
                  <span style={styles.name}>{f.node_name.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                <DensityCell value={f.current_density} />
                <DensityCell value={f.forecast_5min} />
                <DensityCell value={f.forecast_15min} />
                <DensityCell value={f.forecast_30min} />
                <div style={styles.confCell}>
                  <div style={styles.confBar}>
                    <div style={{
                      ...styles.confFill,
                      width: `${Math.round(f.confidence * 100)}%`,
                    }} />
                  </div>
                  <span style={styles.confText}>{Math.round(f.confidence * 100)}%</span>
                </div>
                <div style={styles.uncCell}>
                  <span style={{ color: 'var(--accent-warning)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {Math.round(f.uncertainty * 100)}%
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function DensityCell({ value }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'var(--accent-danger)' : pct >= 50 ? 'var(--accent-warning)' : 'var(--accent-success)'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 11,
      color, fontWeight: 500,
    }}>
      {pct}%
    </span>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRight: '3px solid var(--accent-primary)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    boxShadow: 'var(--shadow-md)',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-md)',
  },
  header: { display: 'flex', alignItems: 'center', gap: 7 },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.14em', color: 'var(--text-muted)', flex: 1,
  },
  badge: {
    fontSize: 10, color: 'var(--accent-primary)',
    background: 'rgba(110,156,251,0.12)', padding: '2px 8px',
    borderRadius: 20,
  },
  colHeaders: {
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.2fr 1fr',
    gap: 6, padding: '0 4px',
  },
  colLabel: {
    fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)',
    fontFamily: 'var(--font-display)',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: 4,
    maxHeight: 260, overflowY: 'auto',
  },
  empty: { color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' },
  row: {
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.2fr 1fr',
    gap: 6, alignItems: 'center',
    padding: '8px 6px', borderRadius: 'var(--radius)',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    transition: 'all 0.2s ease',
  },
  nameCell: { display: 'flex', alignItems: 'center', gap: 6 },
  name: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  confCell: { display: 'flex', alignItems: 'center', gap: 5 },
  uncCell: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4, color: '#facc15' },
  confBar: {
    flex: 1, height: 3, background: 'var(--bg-base)',
    borderRadius: 2, overflow: 'hidden',
  },
  confFill: {
    height: '100%', borderRadius: 2,
    background: 'linear-gradient(90deg, rgba(110,156,251,0.95), rgba(124,207,161,0.85))',
    transition: 'width 0.5s ease',
  },
  confText: {
    fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
    minWidth: 28, textAlign: 'right',
  },
}
