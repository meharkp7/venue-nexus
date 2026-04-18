import React from 'react'
import { BarChart3, DollarSign, Shield, Activity, Users, Zap } from 'lucide-react'

export default function KpiDashboard({ kpis }) {
  if (!kpis) return null

  const stats = [
    {
      label: 'SAFETY SCORE',
      value: `${Math.round(kpis.safety_score)}`,
      unit: '/ 100',
      color: kpis.safety_score > 70 ? '#FFD700' : kpis.safety_score > 40 ? '#D4AF37' : '#B8860B',
      Icon: Shield,
    },
    {
      label: 'AVG WAIT',
      value: `${kpis.avg_wait_time_minutes}`,
      unit: 'min',
      color: kpis.avg_wait_time_minutes < 5 ? '#FFD700' : kpis.avg_wait_time_minutes < 10 ? '#D4AF37' : '#B8860B',
      Icon: Activity,
    },
    {
      label: 'REVENUE / ATTENDEE',
      value: `$${kpis.revenue_per_attendee}`,
      unit: '',
      color: '#FFD700',
      Icon: DollarSign,
    },
    {
      label: 'CONCESSION REVENUE',
      value: `$${Math.round(kpis.total_concession_revenue).toLocaleString()}`,
      unit: '',
      color: '#D4AF37',
      Icon: BarChart3,
    },
    {
      label: 'CONGESTION EVENTS',
      value: `${kpis.congestion_incidents}`,
      unit: '',
      color: kpis.congestion_incidents === 0 ? '#FFD700' : '#B8860B',
      Icon: Zap,
    },
    {
      label: 'NUDGE ACCEPT RATE',
      value: kpis.nudges_sent > 0 ? `${Math.round((kpis.nudges_accepted / kpis.nudges_sent) * 100)}%` : '—',
      unit: `${kpis.nudges_accepted}/${kpis.nudges_sent}`,
      color: '#D4AF37',
      Icon: Users,
    },
  ]

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <BarChart3 size={12} color="var(--text-muted)" />
        <span style={styles.title}>BUSINESS KPIs — REAL-TIME</span>
        <span style={styles.peakBadge}>
          Peak: {kpis.peak_node} ({Math.round(kpis.peak_density * 100)}%)
        </span>
      </div>

      <div style={styles.grid}>
        {stats.map((stat, i) => {
          const { Icon } = stat
          return (
            <div key={i} style={styles.statCard} className="fade-in">
              <div style={styles.statHeader}>
                <Icon size={10} color={stat.color} />
                <span style={styles.statLabel}>{stat.label}</span>
              </div>
              <div style={{ ...styles.statValue, color: stat.color }}>
                {stat.value}
                {stat.unit && <span style={styles.statUnit}>{stat.unit}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Flow Efficiency Bar */}
      <div style={styles.flowWrap}>
        <div style={styles.flowHeader}>
          <span style={styles.flowLabel}>FLOW EFFICIENCY</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#FFD700' }}>
            {Math.round(kpis.flow_efficiency * 100)}%
          </span>
        </div>
        <div style={styles.flowBar}>
          <div style={{
            ...styles.flowFill,
            width: `${Math.round(kpis.flow_efficiency * 100)}%`,
            background: kpis.flow_efficiency > 0.7
              ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.95), rgba(212, 175, 55, 0.85))'
              : kpis.flow_efficiency > 0.4
                ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.9), rgba(184, 134, 11, 0.8))'
                : 'linear-gradient(90deg, rgba(184, 134, 11, 0.95), rgba(212, 175, 55, 0.8))',
          }} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--accent-primary)',
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
  peakBadge: {
    fontSize: 10, color: 'var(--accent-primary)',
    background: 'rgba(241, 205, 122, 0.08)', padding: '2px 8px',
    borderRadius: 20, border: '1px solid rgba(241, 205, 122, 0.18)',
    fontFamily: 'var(--font-mono)',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
  },
  statCard: {
    background: 'linear-gradient(145deg, rgba(255, 223, 162, 0.06), rgba(255, 255, 255, 0.02))',
    border: '1px solid rgba(241, 205, 122, 0.08)',
    borderRadius: 'var(--radius)', padding: '14px',
    display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'all 0.2s',
  },
  statHeader: { display: 'flex', alignItems: 'center', gap: 5 },
  statLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
    color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
  },
  statValue: {
    fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500,
    lineHeight: 1.2,
  },
  statUnit: {
    fontSize: 11, color: 'var(--text-muted)', marginLeft: 3,
  },
  flowWrap: { display: 'flex', flexDirection: 'column', gap: 5 },
  flowHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  flowLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
    color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
  },
  flowBar: {
    height: 6, background: 'var(--bg-base)', borderRadius: 3,
    overflow: 'hidden',
  },
  flowFill: {
    height: '100%', borderRadius: 3, transition: 'width 0.5s ease',
  },
}
