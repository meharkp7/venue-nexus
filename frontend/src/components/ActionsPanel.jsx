import React, { useState } from 'react'
import { CheckCircle, XCircle, Clock, Zap, ChevronDown, ChevronUp, Shield, PlayCircle } from 'lucide-react'

const ACTION_TYPE_ICON = {
  dispatch_staff: '🚨',
  redirect_flow: '🔀',
  trigger_nudge: '📱',
  adjust_pricing: '💰',
  activate_signage: '🪧',
  close_gate: '🚫',
  open_gate: '✅',
  emergency_protocol: '⚠️',
}

const PRIORITY_COLOR = {
  1: '#B8860B',
  2: '#D4AF37',
  3: '#FFD700',
}

export default function ActionsPanel({ actions = [], onApprove, onExecute, onOverride }) {
  const [expanded, setExpanded] = useState(null)

  const pending = actions.filter(a => !a.executed && !a.approved)
  const executed = actions.filter(a => a.approved || a.executed)

  return (
    <section style={styles.wrap} className="card" aria-label="Agentic actions" aria-live="polite">
      <div style={styles.header}>
        <Shield size={12} color="var(--accent-violet)" />
        <span style={styles.title}>AGENTIC ACTIONS</span>
        {pending.length > 0 && (
          <span style={styles.pendingBadge}>
            <Clock size={9} color="var(--accent-warning)" />
            {pending.length} pending
          </span>
        )}
      </div>

      {actions.length === 0 ? (
        <div style={styles.empty}>
          <Zap size={14} color="var(--text-muted)" />
          <span>No actions yet — start the simulation</span>
        </div>
      ) : (
        <div style={styles.list} role="list">
          {actions.slice(-10).reverse().map((action, i) => {
            const isExpanded = expanded === action.id
            const icon = ACTION_TYPE_ICON[action.action_type] || '⚡'
            const prioColor = PRIORITY_COLOR[action.priority] || '#7a9ab0'

            return (
              <div key={action.id} role="listitem" style={{
                ...styles.actionCard,
                borderLeftColor: prioColor,
                opacity: action.executed ? 0.6 : 1,
              }} className="fade-in">
                <button
                  type="button"
                  style={styles.actionTopButton}
                  onClick={() => setExpanded(isExpanded ? null : action.id)}
                  aria-expanded={isExpanded}
                  aria-label={`Action ${action.description}`}
                >
                <div style={styles.actionTop}>
                  <span style={styles.actionIcon}>{icon}</span>
                  <div style={styles.actionMeta}>
                    <div style={styles.actionDesc}>{action.description}</div>
                    <div style={styles.actionSub}>
                      <span style={{ color: prioColor }}>P{action.priority}</span>
                      <span>•</span>
                      <span>{action.target_node_name}</span>
                      <span>•</span>
                      <span>{Math.round(action.confidence * 100)}% conf</span>
                    </div>
                    <div style={styles.actionStats}>
                      <span style={styles.statPill}>Impact -{action.expected_impact_percent ?? 'n/a'}%</span>
                      <span style={styles.statPill}>ETA {action.eta_minutes ?? 'n/a'}m</span>
                    </div>
                  </div>
                  <div style={styles.actionButtons}>
                    {!action.approved && !action.executed && (
                      <>
                        <button style={styles.approveBtn}
                          onClick={(e) => { e.stopPropagation(); onApprove?.(action.id) }}>
                          <CheckCircle size={12} color="var(--accent-success)" />
                          <span style={styles.btnLabel}>Approve</span>
                        </button>
                        <button style={styles.rejectBtn}
                          onClick={(e) => { e.stopPropagation(); onOverride?.(action.id) }}>
                          <XCircle size={12} color="var(--accent-danger)" />
                        </button>
                      </>
                    )}
                    {action.approved && !action.executed && (
                      <button style={styles.executeBtn}
                        onClick={(e) => { e.stopPropagation(); onExecute?.(action.id) }}>
                        <PlayCircle size={12} color="var(--accent-primary)" />
                        <span style={styles.executeLabel}>Execute</span>
                      </button>
                    )}
                    {action.approved && (
                      <span style={styles.statusPill}>
                        {action.executed ? '✓ DONE' : '✓ APPROVED'}
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronUp size={12} color="var(--text-muted)" />
                      : <ChevronDown size={12} color="var(--text-muted)" />
                    }
                  </div>
                </div>
                </button>

                {isExpanded && (
                  <div style={styles.expandedContent} className="fade-in">
                    <div style={styles.reasoningBlock}>
                      <div style={styles.expandLabel}>REASONING</div>
                      <div style={styles.reasoningText}>{action.reasoning}</div>
                    </div>
                    <div style={styles.impactBlock}>
                      <div style={styles.expandLabel}>ESTIMATED IMPACT</div>
                      <div style={styles.impactText}>{action.estimated_impact}</div>
                    </div>
                    <div style={styles.executionGrid}>
                      <div style={styles.executionMetric}>
                        <span style={styles.expandLabel}>PREDICTED IMPACT</span>
                        <span style={styles.executionValue}>-{action.expected_impact_percent ?? 'n/a'}%</span>
                      </div>
                      <div style={styles.executionMetric}>
                        <span style={styles.expandLabel}>ETA</span>
                        <span style={styles.executionValue}>{action.eta_minutes ?? 'n/a'} min</span>
                      </div>
                    </div>
                    <div style={styles.confBar}>
                      <div style={{
                        ...styles.confFill,
                        width: `${Math.round(action.confidence * 100)}%`,
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-card)',
    border: '1px solid #D4AF37',
    borderBottom: '3px solid #D4AF37',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)',
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
  pendingBadge: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 10, color: '#D4AF37',
    background: 'rgba(212, 175, 55, 0.15)', padding: '2px 8px',
    borderRadius: 20, border: '1px solid rgba(212, 175, 55, 0.3)',
  },
  empty: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    color: 'var(--text-muted)', fontSize: 12, padding: '20px 0',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: 8,
    maxHeight: 400, overflowY: 'auto',
  },
  actionCard: {
    background: 'var(--bg-panel)', borderRadius: 'var(--radius)',
    borderLeft: '3px solid', overflow: 'hidden',
    transition: 'all 0.2s',
  },
  actionTop: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 12px', cursor: 'pointer',
  },
  actionTopButton: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    color: 'inherit',
    cursor: 'pointer',
  },
  actionIcon: { fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 2 },
  actionMeta: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  actionDesc: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 },
  actionSub: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
  },
  actionStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  statPill: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent-primary)',
    background: 'rgba(241, 205, 122, 0.08)',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    padding: '3px 6px',
    borderRadius: 999,
  },
  actionButtons: { display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 },
  approveBtn: {
    minWidth: 28, height: 28, borderRadius: 'var(--radius)',
    background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s', gap: 4, padding: '0 8px',
  },
  rejectBtn: {
    width: 28, height: 28, borderRadius: 'var(--radius)',
    background: 'rgba(184, 134, 11, 0.15)', border: '1px solid rgba(184, 134, 11, 0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  executeBtn: {
    minWidth: 28, height: 28, borderRadius: 'var(--radius)',
    background: 'rgba(241, 205, 122, 0.12)', border: '1px solid rgba(241, 205, 122, 0.28)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s', gap: 4, padding: '0 8px',
  },
  statusPill: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
    color: '#D4AF37', background: 'rgba(212, 175, 55, 0.15)',
    padding: '2px 7px', borderRadius: 20,
  },
  expandedContent: {
    padding: '0 12px 12px 38px',
    display: 'flex', flexDirection: 'column', gap: 8,
    borderTop: '1px solid var(--border)',
    marginTop: 0, paddingTop: 10,
  },
  expandLabel: {
    fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
    color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
    marginBottom: 3,
  },
  reasoningBlock: {},
  reasoningText: { fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 },
  impactBlock: {},
  impactText: {
    fontSize: 11, color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
  },
  executionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
  },
  executionMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '8px',
    borderRadius: 'var(--radius)',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
  },
  executionValue: {
    fontSize: 12,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  btnLabel: {
    fontSize: 9,
    color: 'var(--accent-success)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 700,
  },
  executeLabel: {
    fontSize: 9,
    color: 'var(--accent-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 700,
  },
  confBar: {
    height: 3, background: 'var(--bg-base)', borderRadius: 2,
    overflow: 'hidden',
  },
  confFill: {
    height: '100%', borderRadius: 2,
    background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.95), rgba(255, 215, 0, 0.95))',
    transition: 'width 0.5s ease',
  },
}
