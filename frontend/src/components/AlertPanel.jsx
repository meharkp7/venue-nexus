import React from 'react'
import { AlertTriangle, AlertOctagon, Info, Bell } from 'lucide-react'

const LEVEL_CONFIG = {
  critical: {
    color: '#B8860B',
    bg: 'linear-gradient(135deg, rgba(184, 134, 11, 0.08) 0%, rgba(184, 134, 11, 0.02) 100%)',
    Icon: AlertOctagon,
    border: '1px solid rgba(184, 134, 11, 0.2)',
    accent: '#B8860B',
  },
  high: {
    color: '#D4AF37',
    bg: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.01) 100%)',
    Icon: AlertTriangle,
    border: '1px solid rgba(212, 175, 55, 0.15)',
    accent: '#D4AF37',
  },
  medium: {
    color: '#FFD700',
    bg: 'linear-gradient(135deg, rgba(255, 215, 0, 0.07) 0%, rgba(255, 215, 0, 0.02) 100%)',
    Icon: AlertTriangle,
    border: '1px solid rgba(255, 215, 0, 0.2)',
    accent: '#FFD700',
  },
  low: {
    color: '#D4AF37',
    bg: 'linear-gradient(135deg, rgba(212, 175, 55, 0.04) 0%, rgba(212, 175, 55, 0.01) 100%)',
    Icon: Info,
    border: '1px solid rgba(212, 175, 55, 0.15)',
    accent: '#D4AF37',
  },
}

export default function AlertPanel({ alerts = [] }) {
  return (
    <section style={styles.wrap} className="card widget-float" aria-label="Congestion alerts" aria-live="polite">
      <div style={styles.header}>
        <Bell size={12} color="var(--text-muted)" />
        <span style={styles.title}>CONGESTION ALERTS</span>
        {alerts.length > 0 && (
          <span style={{ ...styles.badge,
            background: alerts.some(a => a.alert_level === 'critical') ? 'rgba(184, 134, 11, 0.14)' : 'rgba(212, 175, 55, 0.12)',
            color: alerts.some(a => a.alert_level === 'critical') ? '#B8860B' : '#D4AF37',
          }}>{alerts.length}</span>
        )}
      </div>

      <div style={styles.list} role="list">
        {alerts.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyDot} />
            All zones nominal
          </div>
        ) : (
          alerts.map((alert, i) => {
            const cfg = LEVEL_CONFIG[alert.alert_level] || LEVEL_CONFIG.low
            const { Icon } = cfg
            return (
              <div key={i} role="listitem" aria-label={`${alert.node_name} alert level ${alert.alert_level}, density ${Math.round(alert.density * 100)} percent`} style={{ ...styles.alertItem, background: cfg.bg, borderColor: cfg.border }}
                className="fade-in">
                <div style={styles.alertTop}>
                  <Icon size={12} color={cfg.color} />
                  <span style={{ ...styles.alertName, color: cfg.color }}>{alert.node_name}</span>
                  <span style={{ ...styles.alertLevel, color: cfg.color }}>{alert.alert_level.toUpperCase()}</span>
                </div>
                <div style={styles.alertBar}>
                  <div style={{ ...styles.alertFill,
                    width: `${Math.round(alert.density * 100)}%`,
                    background: cfg.color }} />
                </div>
                <div style={styles.alertMeta}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: cfg.color }}>
                    {Math.round(alert.density * 100)}%
                  </span>
                  {alert.predicted_surge_in_minutes != null && (
                    <span style={styles.alertPrediction}>
                      surge in ~{alert.predicted_surge_in_minutes}m
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-card)',
    border: '1px solid #D4AF37',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)',
    transition: 'var(--transition)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    marginBottom: 'var(--spacing-md)',
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    flex: 1,
  },
  badge: {
    fontSize: 11,
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: 20,
    background: 'rgba(212, 175, 55, 0.12)',
    color: '#D4AF37',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)',
    maxHeight: 400,
    overflowY: 'auto',
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    color: 'var(--text-muted)',
    fontSize: 14,
    padding: 'var(--spacing-md) 0',
    justifyContent: 'center',
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#FFD700',
    boxShadow: '0 0 12px rgba(255, 215, 0, 0.25)',
    flexShrink: 0,
    animation: 'pulse-dot 2s ease-in-out infinite',
  },
  alertItem: {
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)',
    transition: 'var(--transition)',
    background: 'var(--bg-surface)',
    borderLeft: '3px solid',
  },
  alertTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
  },
  alertName: {
    flex: 1,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  alertLevel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  alertBar: {
    height: 4,
    background: 'var(--bg-hover)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  alertFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  alertMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertPrediction: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
}
