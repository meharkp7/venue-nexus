import React, { useEffect, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp } from 'lucide-react'

const MAX_POINTS = 40

export default function DensityChart({ density, phase, tick }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (density == null) return
    setHistory(prev => {
      const next = [...prev, {
        tick,
        density: Math.round(density * 100),
        phase,
      }]
      return next.slice(-MAX_POINTS)
    })
  }, [tick, density])

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={styles.tooltip}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-primary)' }}>
          {payload[0].value}%
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          tick {payload[0].payload.tick}
        </div>
      </div>
    )
  }

  return (
    <section style={styles.wrap} className="card widget-float" aria-label="Overall density trend chart" aria-live="polite">
      <div style={styles.header}>
        <TrendingUp size={12} color="var(--text-muted)" />
        <span style={styles.title}>OVERALL DENSITY TREND</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600 }}>
          {density != null ? `${Math.round(density * 100)}%` : '—'}
        </span>
      </div>
      <div role="img" aria-label={`Overall density trend. Current density ${density != null ? Math.round(density * 100) : 0} percent. Phase ${phase || 'unknown'}.`}>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <XAxis dataKey="tick" hide />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#8B94A5', fontFamily: 'var(--font-mono)' }}
            tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={80} stroke="var(--accent-danger)" strokeDasharray="3 3" strokeOpacity={0.3} />
          <ReferenceLine y={50} stroke="var(--accent-warning)" strokeDasharray="3 3" strokeOpacity={0.2} />
          <Line type="monotone" dataKey="density"
            stroke="var(--accent-primary)" strokeWidth={2.5} dot={false}
            activeDot={{ r: 4, fill: 'var(--accent-primary)', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
      <div style={styles.refLabels}>
        <span style={{ color: 'var(--accent-danger)' }}>— 80% critical</span>
        <span style={{ color: 'var(--accent-warning)' }}>— 50% warning</span>
      </div>
    </section>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderTop: '3px solid var(--accent-primary)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    boxShadow: 'var(--shadow-md)',
    transition: 'var(--transition)',
  },
  header: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 },
  title: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', flex: 1 },
  tooltip: {
    background: 'var(--bg-panel)', border: '1px solid var(--border)',
    borderRadius: 4, padding: '6px 10px',
  },
  refLabels: { display: 'flex', gap: 16, marginTop: 6, fontSize: 10, fontFamily: 'var(--font-mono)' },
}
