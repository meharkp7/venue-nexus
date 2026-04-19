import React, { useState, useEffect } from 'react'
import { FileText, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../services/api'

export default function DecisionLog() {
  const [decisions, setDecisions] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchDecisions = async () => {
    setLoading(true)
    try {
      const data = await api.getDecisions()
      setDecisions(data.decisions || [])
    } catch (e) {
      console.error('Failed to load decisions:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDecisions()
    const interval = setInterval(fetchDecisions, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section style={styles.wrap} aria-label="Decision audit trail" aria-live="polite">
      <div style={styles.header}>
        <FileText size={12} color="var(--text-muted)" />
        <span style={styles.title}>DECISION AUDIT TRAIL</span>
        <span style={styles.badge}>{decisions.length} entries</span>
        <button style={styles.refreshBtn} aria-label="Refresh decision audit trail" onClick={fetchDecisions}>
          ↻ Refresh
        </button>
      </div>

      <div style={styles.list} role="list">
        {decisions.length === 0 ? (
          <div style={styles.empty}>No decisions recorded yet</div>
        ) : (
          decisions.slice(-20).reverse().map((d, i) => {
            const isExpanded = expanded === d.id
            return (
              <div key={d.id} style={styles.entry} role="listitem" className="fade-in">
                <button
                  type="button"
                  style={styles.entryButton}
                  onClick={() => setExpanded(isExpanded ? null : d.id)}
                  aria-expanded={isExpanded}
                  aria-label={`Decision log entry tick ${d.tick}, phase ${d.phase}`}
                >
                <div style={styles.entryTop}>
                  <Clock size={10} color="var(--text-muted)" />
                  <span style={styles.entryTick}>Tick {d.tick}</span>
                  <span style={styles.entryPhase}>{d.phase}</span>
                  <span style={styles.entryTrigger}>{d.trigger}</span>
                  <span style={styles.entryDensity}>
                    {Math.round(d.overall_density_before * 100)}%
                  </span>
                  {isExpanded
                    ? <ChevronUp size={10} color="var(--text-muted)" />
                    : <ChevronDown size={10} color="var(--text-muted)" />
                  }
                </div>
                </button>

                {isExpanded && (
                  <div style={styles.expandedContent} className="fade-in">
                    <div style={styles.section}>
                      <div style={styles.sectionLabel}>REASONING STEPS</div>
                      {d.reasoning_steps.map((step, j) => (
                        <div key={j} style={styles.reasonStep}>
                          <span style={styles.stepNum}>{j + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>

                    {d.actions_proposed.length > 0 && (
                      <div style={styles.section}>
                        <div style={styles.sectionLabel}>
                          ACTIONS PROPOSED ({d.actions_proposed.length})
                        </div>
                        {d.actions_proposed.map((a, j) => (
                          <div key={j} style={styles.actionLine}>→ {a}</div>
                        ))}
                      </div>
                    )}

                    {d.actions_executed.length > 0 && (
                      <div style={styles.section}>
                        <div style={{ ...styles.sectionLabel, color: 'var(--accent-success)' }}>
                          ACTIONS EXECUTED ({d.actions_executed.length})
                        </div>
                        {d.actions_executed.map((a, j) => (
                          <div key={j} style={{ ...styles.actionLine, color: 'var(--accent-success)' }}>✓ {a}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
    border: '1px solid var(--border)',
    borderRight: '3px solid var(--accent-success)',
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
    fontSize: 10, color: 'var(--text-secondary)',
    background: 'var(--bg-panel)', padding: '2px 7px', borderRadius: 20,
  },
  refreshBtn: {
    background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    color: 'var(--text-muted)', fontSize: 10, padding: '3px 8px',
    cursor: 'pointer', fontFamily: 'var(--font-display)',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: 6,
    maxHeight: 400, overflowY: 'auto',
  },
  empty: { color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' },
  entry: {
    background: 'var(--bg-panel)', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', overflow: 'hidden',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  entryButton: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    color: 'inherit',
    cursor: 'pointer',
  },
  entryTop: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px',
  },
  entryTick: {
    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
    color: 'var(--accent-cyan)',
  },
  entryPhase: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
    color: 'var(--text-muted)', textTransform: 'uppercase',
  },
  entryTrigger: {
    flex: 1, fontSize: 10, color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  entryDensity: {
    fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)',
  },
  expandedContent: {
    padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 8,
    borderTop: '1px solid var(--border)', paddingTop: 8,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 3 },
  sectionLabel: {
    fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
    color: 'var(--text-muted)', fontFamily: 'var(--font-display)',
    marginBottom: 2,
  },
  reasonStep: {
    display: 'flex', gap: 5, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
  },
  stepNum: { color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 600 },
  actionLine: { fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 8 },
}
