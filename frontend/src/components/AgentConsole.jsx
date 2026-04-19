import React, { useEffect, useMemo, useState } from 'react'
import { Terminal, Send, Cpu, ShieldCheck, Link2, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAgent } from '../hooks/useAgent'
import { api } from '../services/api'
import StructuredDecisionCards from './StructuredDecisionCards'

const QUICK_QUERIES = [
  'What is the current congestion hotspot?',
  'Suggest exit strategy for post-match',
  'Which concession stands need redirects?',
  'Show highest risk zones right now',
]

export default function AgentConsole() {
  const [input, setInput] = useState('')
  const [pendingActions, setPendingActions] = useState([])
  const [approvalState, setApprovalState] = useState(null)
  const { strategy, loading, error, query, lastQuestion, history } = useAgent()

  const fetchPendingActions = async () => {
    try {
      const data = await api.getDecisions()
      setPendingActions(data.pending_actions || [])
    } catch (e) {
      console.error('Failed to load pending actions:', e)
    }
  }

  useEffect(() => {
    fetchPendingActions()
  }, [])

  const handleSend = () => {
    const q = input.trim() || null
    query(q)
    setInput('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const mappedAction = useMemo(() => {
    if (!strategy?.data?.actions?.length || !pendingActions.length) return null
    const primary = strategy.data.actions[0]
    const target = primary.target_zone?.toLowerCase()
    return pendingActions.find(action =>
      action.target_node_name?.toLowerCase().includes(target) ||
      action.description?.toLowerCase().includes(target) ||
      action.action_type === primary.action
    ) || pendingActions[0]
  }, [strategy, pendingActions])

  const handleApproveMappedAction = async () => {
    if (!mappedAction) return
    try {
      await api.approveAction(mappedAction.id, true)
      setApprovalState(`Approved ${mappedAction.description}`)
      fetchPendingActions()
    } catch (e) {
      setApprovalState(`Approval failed: ${e.message}`)
    }
  }

  const currentSummary = strategy?.data?.summary || 'Generate a strategy to see the live control brief.'

  return (
    <section style={styles.wrap} aria-label="Agent console" aria-live="polite">
      <div style={styles.header}>
        <Cpu size={12} color="var(--accent-primary)" />
        <span style={styles.title}>AGENT CONSOLE</span>
        <div style={styles.vertexBadge}>
          <div style={styles.vertexDot} />
          Vertex AI
        </div>
      </div>

      <div style={styles.briefStrip}>
        <div style={styles.briefLabel}>LIVE BRIEF</div>
        <div style={styles.briefText}>{currentSummary}</div>
      </div>

      <div style={styles.output}>
        {!strategy && !loading && !error && (
          <div style={styles.placeholder}>
            <Terminal size={16} color="var(--text-muted)" />
            <span>Ask the agent a question or use Generate Strategy to produce hotspots, actions, and predictions.</span>
          </div>
        )}

        {loading && (
          <div style={styles.thinking}>
            <div style={styles.thinkingDots}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ ...styles.dot, animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Agent is reasoning across live venue telemetry...</span>
          </div>
        )}

        {error && <div style={styles.error} role="alert">{error}</div>}

        {strategy && !loading && (
          <div style={styles.strategyOutput} className="fade-in">
            <div style={styles.strategyHeader}>
              <Cpu size={10} color="var(--accent-primary)" />
              <span style={styles.strategyHeaderLabel}>
                AGENT RESPONSE {strategy.vertex_ai_active ? '(Vertex AI)' : '(Rule-Based Intelligence)'}
              </span>
            </div>

            <div style={styles.mappingCard}>
              <div style={styles.mappingHeader}>
                <Link2 size={12} color="var(--accent-primary)" />
                <span>Operator Query → AI Response</span>
              </div>
              <div style={styles.mappingGrid}>
                <div style={styles.mappingBlock}>
                  <span style={styles.mappingLabel}>Query</span>
                  <span style={styles.mappingValue}>{lastQuestion || 'Generate Strategy'}</span>
                </div>
                <div style={styles.mappingBlock}>
                  <span style={styles.mappingLabel}>AI Outcome</span>
                  <span style={styles.mappingValue}>{strategy?.data?.risk_assessment || strategy?.strategy}</span>
                </div>
              </div>
            </div>

            {mappedAction && (
              <div style={styles.approvalCard}>
                <div style={styles.approvalMeta}>
                  <div style={styles.approvalHeader}>
                    <ShieldCheck size={12} color="var(--accent-primary)" />
                    <span>Approve Action</span>
                  </div>
                  <div style={styles.approvalText}>
                    {mappedAction.description}
                    <span style={styles.approvalSubline}>
                      Impact {mappedAction.expected_impact_percent || 'n/a'}% • ETA {mappedAction.eta_minutes || 'n/a'}m • Confidence {Math.round((mappedAction.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
                <button style={styles.approveCta} aria-label="Approve mapped agent action" onClick={handleApproveMappedAction}>
                  <CheckCircle2 size={14} />
                  Approve Action
                </button>
              </div>
            )}

            {approvalState && <div style={styles.approvalToast}>{approvalState}</div>}

            {strategy.data ? (
              <StructuredDecisionCards strategy={strategy} />
            ) : (
              <pre style={styles.strategyText}>{strategy.strategy}</pre>
            )}
          </div>
        )}
      </div>

      <div style={styles.historyPanel}>
        <div style={styles.historyHeader}>
          <Sparkles size={11} color="var(--accent-primary)" />
          <span>Recent Query Map</span>
        </div>
        <div style={styles.historyList}>
          {history.length === 0 ? (
            <span style={styles.historyEmpty}>No agent responses yet</span>
          ) : (
            history.map(item => (
              <div key={item.id} style={styles.historyRow}>
                <span style={styles.historyQuestion}>{item.question}</span>
                <span style={styles.historyResponse}>{item.responseSummary}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={styles.quickWrap}>
        {QUICK_QUERIES.map((q, i) => (
          <button key={i} style={styles.quickBtn} aria-label={`Ask agent: ${q}`} onClick={() => query(q)}>
            {q}
          </button>
        ))}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="Ask the agent... (e.g. 'Predict the next hotspot')"
          aria-label="Ask the agent a question"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button style={styles.sendBtn} aria-label="Send agent question" onClick={handleSend} disabled={loading}>
          <Send size={13} color={loading ? 'var(--text-muted)' : 'var(--accent-primary)'} />
        </button>
        <button style={styles.generateBtn} aria-label="Generate proactive strategy" onClick={() => query(null)} disabled={loading}>
          Generate Strategy
        </button>
      </div>
    </section>
  )
}

const styles = {
  wrap: {
    background: 'linear-gradient(145deg, rgba(18, 14, 9, 0.94) 0%, rgba(8, 8, 7, 0.9) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    borderLeft: '3px solid var(--accent-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    boxShadow: 'var(--shadow-lg)',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-md)',
    backdropFilter: 'blur(16px)',
  },
  header: { display: 'flex', alignItems: 'center', gap: 7 },
  title: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)', flex: 1 },
  vertexBadge: {
    display: 'flex', alignItems: 'center', gap: 5, fontSize: 10,
    color: 'var(--accent-primary)', background: 'rgba(241, 205, 122, 0.08)',
    padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(241, 205, 122, 0.18)',
  },
  vertexDot: {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)',
    animation: 'pulse-dot 2s ease-in-out infinite',
  },
  briefStrip: {
    padding: '10px 12px',
    borderRadius: 'var(--radius)',
    background: 'linear-gradient(135deg, rgba(241, 205, 122, 0.12) 0%, rgba(80, 55, 13, 0.12) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
  },
  briefLabel: {
    fontSize: 9,
    letterSpacing: '0.14em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 700,
  },
  briefText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  output: {
    minHeight: 240,
    background: 'linear-gradient(135deg, rgba(11, 10, 8, 0.9) 0%, rgba(21, 16, 11, 0.82) 100%)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(241, 205, 122, 0.1)',
    padding: 14,
    overflowY: 'auto',
    maxHeight: 420,
    backdropFilter: 'blur(8px)',
  },
  placeholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 10, height: '100%',
    color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', minHeight: 160,
  },
  thinking: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' },
  thinkingDots: { display: 'flex', gap: 4 },
  dot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--accent-primary)', animation: 'pulse-dot 0.9s ease-in-out infinite',
  },
  error: { color: 'var(--accent-danger)', fontSize: 12, padding: '4px 0' },
  strategyOutput: { display: 'flex', flexDirection: 'column', gap: 12 },
  strategyHeader: { display: 'flex', alignItems: 'center', gap: 5 },
  strategyHeaderLabel: {
    color: 'var(--accent-primary)',
    fontSize: 10,
    letterSpacing: '0.1em',
  },
  mappingCard: {
    padding: '12px',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    background: 'rgba(241, 205, 122, 0.05)',
  },
  mappingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  mappingGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  mappingBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  mappingLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
  },
  mappingValue: {
    fontSize: 11,
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
  },
  approvalCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    background: 'linear-gradient(135deg, rgba(241, 205, 122, 0.12) 0%, rgba(120, 82, 18, 0.12) 100%)',
  },
  approvalMeta: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  approvalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--text-primary)',
    fontWeight: 700,
  },
  approvalText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
  },
  approvalSubline: {
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
  },
  approveCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--gradient-primary)',
    border: '1px solid rgba(255, 226, 166, 0.34)',
    borderRadius: 'var(--radius)',
    color: '#140f08',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  approvalToast: {
    color: 'var(--accent-success)',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
  },
  strategyText: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)',
    lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  },
  historyPanel: {
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(241, 205, 122, 0.1)',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '10px 12px',
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  historyEmpty: {
    color: 'var(--text-muted)',
    fontSize: 11,
  },
  historyRow: {
    display: 'grid',
    gridTemplateColumns: '0.95fr 1.05fr',
    gap: 10,
    fontSize: 10,
  },
  historyQuestion: {
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  historyResponse: {
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  quickWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  quickBtn: {
    fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-panel)',
    border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px',
    cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'all 0.2s',
  },
  inputRow: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    background: 'linear-gradient(135deg, rgba(20, 16, 11, 0.88) 0%, rgba(9, 8, 7, 0.82) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    borderRadius: 'var(--radius)',
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    outline: 'none',
    backdropFilter: 'blur(8px)',
  },
  sendBtn: {
    width: 36, height: 36, background: 'rgba(241, 205, 122, 0.08)',
    border: '1px solid rgba(241, 205, 122, 0.18)', borderRadius: 'var(--radius)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  generateBtn: {
    background: 'rgba(241, 205, 122, 0.12)', border: '1px solid rgba(241, 205, 122, 0.22)',
    color: 'var(--accent-primary)', padding: '0 14px', borderRadius: 'var(--radius)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
    letterSpacing: '0.04em',
  },
}
