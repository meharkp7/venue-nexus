import React from 'react'
import { MessageSquare, Gift, ArrowRight } from 'lucide-react'

const URGENCY_COLOR = {
  critical: '#DC2626',
  high: '#DC2626',
  medium: '#D97706',
  low: '#059669',
}

export default function NudgePanel({ nudges = [] }) {
  return (
    <div style={styles.wrap} className="card widget-float">
      <div style={styles.header}>
        <MessageSquare size={12} color="var(--text-muted)" />
        <span style={styles.title}>ATTENDEE NUDGES</span>
        {nudges.length > 0 && (
          <span style={styles.badge}>{nudges.length} active</span>
        )}
      </div>

      <div style={styles.list}>
        {nudges.length === 0 ? (
          <div style={styles.empty}>No nudges queued</div>
        ) : (
          nudges.map((nudge, i) => {
            const color = URGENCY_COLOR[nudge.urgency] || 'var(--accent-primary)'
            return (
              <div key={i} style={{ ...styles.nudge, borderLeftColor: color }} className="slide-in">
                <div style={styles.nudgeMsg}>{nudge.message}</div>
                {nudge.incentive && (
                  <div style={styles.incentive}>
                    <Gift size={10} color="var(--accent-success)" />
                    <span style={{ color: 'var(--accent-success)' }}>{nudge.incentive}</span>
                  </div>
                )}
                {nudge.redirect_to && (
                  <div style={styles.redirect}>
                    <ArrowRight size={10} color={color} />
                    <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                      → {nudge.redirect_to}
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--accent-danger)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    boxShadow: 'var(--shadow-md)',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-md)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
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
    color: 'var(--accent-primary)',
    background: 'rgba(37, 99, 235, 0.1)',
    padding: '4px 10px',
    borderRadius: 20,
    fontWeight: 600,
    border: '1px solid rgba(37, 99, 235, 0.2)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)',
    maxHeight: 320,
    overflowY: 'auto',
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: 14,
    padding: 'var(--spacing-lg) 0',
    textAlign: 'center',
  },
  nudge: {
    padding: 'var(--spacing-md)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(37,99,235,0.03) 100%)',
    borderRadius: 'var(--radius)',
    borderLeft: '3px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)',
    border: '1px solid var(--border-light)',
    transition: 'var(--transition)',
  },
  nudgeMsg: {
    fontSize: 13,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    fontWeight: 500,
  },
  incentive: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    fontSize: 12,
    color: 'var(--accent-success)',
    fontWeight: 500,
  },
  redirect: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    fontSize: 11,
  },
}
