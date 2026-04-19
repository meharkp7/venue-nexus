import React from 'react'
import { Navigation } from 'lucide-react'

export default function RoutePanel({ routes = [] }) {
  return (
    <section style={styles.wrap} className="card widget-float" aria-label="Exit routing recommendations" aria-live="polite">
      <div style={styles.header}>
        <Navigation size={12} color="var(--text-muted)" />
        <span style={styles.title}>EXIT ROUTING</span>
      </div>
      <div style={styles.list} role="list">
        {routes.length === 0 ? (
          <div style={styles.empty}>No rerouting active</div>
        ) : (
          routes.slice(0, 6).map((r, i) => (
            <div key={i} role="listitem" aria-label={`Route from ${r.from_node} to ${r.to_node} in ${r.estimated_time_minutes} minutes`} style={styles.route}>
              <div style={styles.routeTop}>
                <span style={styles.routeFrom}>{r.from_node}</span>
                <span style={styles.arrow}>→</span>
                <span style={styles.routeTo}>{r.to_node}</span>
                <span style={styles.routeTime}>{r.estimated_time_minutes}m</span>
              </div>
              <div style={styles.routeReason}>{r.reason}</div>
              {r.cost_breakdown && (
                <div style={styles.costGrid}>
                  {Object.entries(r.cost_breakdown).map(([key, value]) => (
                    <div key={key} style={styles.costItem}>
                      <span style={styles.costLabel}>{key.toUpperCase()}</span>
                      <span style={styles.costValue}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={styles.routePath}>
                {r.recommended_path.join(' › ')}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
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
  title: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)' },
  list: { display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 220, overflowY: 'auto' },
  empty: { color: 'var(--text-muted)', fontSize: 12 },
  route: {
    padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius)', borderLeft: '3px solid rgba(196,173,114,0.72)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
    transition: 'background 0.2s ease, transform 0.2s ease',
  },
  routeTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  routeFrom: { fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' },
  arrow: { color: 'var(--accent-primary)', fontSize: 12 },
  routeTo: { fontSize: 11, fontWeight: 600, color: 'var(--accent-success)', fontFamily: 'var(--font-mono)', flex: 1 },
  routeTime: { fontSize: 10, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' },
  routePath: { fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 },
  routeReason: { fontSize: 10, color: '#facc15', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' },
  costGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6,
    marginBottom: 8,
  },
  costItem: {
    background: 'rgba(110,156,251,0.08)', padding: '6px 8px', borderRadius: 'var(--radius)',
  },
  costLabel: { fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  costValue: { fontSize: 11, color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' },
}
