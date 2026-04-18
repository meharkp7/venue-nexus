import React from 'react'
import { AlertTriangle, TrendingUp, Clock, Target, Route, Zap, Brain } from 'lucide-react'

export default function StructuredDecisionCards({ strategy }) {
  if (!strategy || !strategy.data) {
    return <div style={styles.fallback}>No structured data available</div>
  }

  const { data } = strategy
  const riskColors = {
    CRITICAL: '#f06a6a',
    HIGH: '#f2b75d',
    MEDIUM: '#e0be72',
    LOW: '#7fd39d',
  }

  const urgencyColors = {
    IMMEDIATE: '#f06a6a',
    HIGH: '#f2b75d',
    MEDIUM: '#e0be72',
    LOW: '#7fd39d',
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <Brain size={14} color="var(--accent-primary)" />
          <span>Risk Assessment</span>
        </div>
        <div style={styles.riskBox}>
          <div style={styles.riskText}>{data.risk_assessment}</div>
        </div>
      </div>

      {data.hotspots?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <AlertTriangle size={14} color={riskColors.CRITICAL} />
            <span>Hotspots</span>
          </div>
          <div style={styles.cardsGrid}>
            {data.hotspots.map((hotspot, i) => {
              const riskColor = riskColors[hotspot.risk_level] || 'var(--accent-primary)'
              return (
                <div key={i} style={{ ...styles.hotspotCard, borderColor: `${riskColor}40` }}>
                  <div style={styles.cardHeader}>
                    <span style={styles.zoneName}>{hotspot.zone}</span>
                    <span style={{ ...styles.riskBadge, backgroundColor: riskColor }}>
                      {hotspot.risk_level}
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Current density</span>
                    <span style={styles.metricValue}>{hotspot.density_percent}%</span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Predicted density</span>
                    <span style={{ ...styles.metricValue, color: riskColor }}>
                      {hotspot.future_density_percent ?? hotspot.density_percent}%
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Escalation ETA</span>
                    <span style={styles.metricValue}>
                      <Clock size={12} />
                      {hotspot.predicted_escalation_minutes}m
                    </span>
                  </div>
                  <div style={styles.metricRow}>
                    <span style={styles.metricLabel}>Confidence</span>
                    <span style={styles.metricValue}>{Math.round(hotspot.confidence * 100)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data.actions?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Zap size={14} color="var(--accent-primary)" />
            <span>Actions</span>
          </div>
          <div style={styles.actionList}>
            {data.actions.map((action, i) => {
              const urgencyColor = urgencyColors[action.urgency] || 'var(--accent-primary)'
              return (
                <div key={i} style={{ ...styles.actionCard, borderColor: `${urgencyColor}44` }}>
                  <div style={styles.actionHeader}>
                    <div style={styles.actionInfo}>
                      <span style={styles.actionType}>{action.action.replaceAll('_', ' ')}</span>
                      <span style={styles.actionTarget}>Target: {action.target_zone}</span>
                    </div>
                    <span style={{ ...styles.urgencyBadge, backgroundColor: urgencyColor }}>
                      {action.urgency}
                    </span>
                  </div>
                  <div style={styles.actionDescription}>{action.description}</div>
                  <div style={styles.actionMetrics}>
                    <div style={styles.actionMetric}>
                      <Target size={12} />
                      <span>Predicted impact: -{action.expected_impact_percent}%</span>
                    </div>
                    <div style={styles.actionMetric}>
                      <Clock size={12} />
                      <span>ETA: {action.eta_minutes}m</span>
                    </div>
                    <div style={styles.actionMetric}>
                      <span>Confidence: {Math.round(action.confidence * 100)}%</span>
                    </div>
                  </div>
                  {action.route_path?.length > 0 && (
                    <div style={styles.routeLine}>
                      Route: {action.route_path.join(' › ')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data.predictions?.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <TrendingUp size={14} color="var(--accent-primary)" />
            <span>Predictions</span>
          </div>
          <div style={styles.predictionGrid}>
            {data.predictions.map((pred, i) => (
              <div key={i} style={styles.predictionCard}>
                <div style={styles.predictionZone}>{pred.zone}</div>
                <div style={styles.predictionMetric}>
                  <span style={styles.predictionLabel}>Future density</span>
                  <span style={styles.predictionValue}>{pred.future_density_percent}%</span>
                </div>
                <div style={styles.predictionMeta}>
                  <span>{pred.timeframe_minutes}m horizon</span>
                  <span>{Math.round(pred.confidence * 100)}% confidence</span>
                </div>
                <div style={styles.confidenceBar}>
                  <div style={{ ...styles.confidenceFill, width: `${pred.confidence * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.exit_strategy && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Route size={14} color="var(--accent-primary)" />
            <span>Exit Strategy</span>
          </div>
          <div style={styles.exitCard}>
            <div style={styles.exitRoutes}>
              <span style={styles.exitLabel}>Best Routes</span>
              <div style={styles.routeTags}>
                {data.exit_strategy.best_routes?.map((route, i) => (
                  <span key={i} style={styles.routeTag}>{route}</span>
                ))}
              </div>
            </div>
            <div style={styles.exitPlan}>
              <span style={styles.exitLabel}>Load Balancing Plan</span>
              <span style={styles.exitText}>{data.exit_strategy.load_balancing_plan}</span>
            </div>
          </div>
        </div>
      )}

      {data.summary && (
        <div style={styles.section}>
          <div style={styles.summaryBox}>
            <span style={styles.summaryLabel}>Executive Summary</span>
            <span style={styles.summaryText}>{data.summary}</span>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: 'var(--font-body)',
    animation: 'fade-in 0.5s ease-out',
  },
  fallback: {
    padding: '20px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  riskBox: {
    background: 'linear-gradient(135deg, rgba(240, 106, 106, 0.12) 0%, rgba(93, 21, 21, 0.14) 100%)',
    border: '1px solid rgba(240, 106, 106, 0.18)',
    borderRadius: '10px',
    padding: '12px',
  },
  riskText: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    fontWeight: '500',
    lineHeight: 1.55,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '12px',
  },
  hotspotCard: {
    background: 'linear-gradient(145deg, rgba(19, 15, 10, 0.92) 0%, rgba(10, 9, 7, 0.84) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    borderRadius: '10px',
    padding: '12px',
    boxShadow: '0 14px 28px rgba(0, 0, 0, 0.22)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: 8,
  },
  zoneName: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  riskBadge: {
    color: '#140f08',
    fontSize: '9px',
    fontWeight: '800',
    padding: '3px 7px',
    borderRadius: '999px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    gap: 12,
  },
  metricLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  metricValue: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'var(--font-mono)',
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actionCard: {
    background: 'linear-gradient(145deg, rgba(241, 205, 122, 0.09) 0%, rgba(88, 60, 15, 0.12) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    borderRadius: '10px',
    padding: '12px',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: '6px',
  },
  actionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  actionType: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--accent-primary)',
    textTransform: 'capitalize',
  },
  actionTarget: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  urgencyBadge: {
    color: '#140f08',
    fontSize: '9px',
    fontWeight: '800',
    padding: '3px 7px',
    borderRadius: '999px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  actionDescription: {
    fontSize: '12px',
    color: 'var(--text-primary)',
    marginBottom: '8px',
    lineHeight: '1.55',
  },
  actionMetrics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  routeLine: {
    marginTop: '8px',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.5,
  },
  actionMetric: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    padding: '5px 8px',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.04)',
    fontFamily: 'var(--font-mono)',
  },
  predictionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  predictionCard: {
    background: 'linear-gradient(145deg, rgba(16, 14, 9, 0.92) 0%, rgba(10, 9, 7, 0.84) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    borderRadius: '10px',
    padding: '12px',
  },
  predictionZone: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  predictionMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  predictionLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  predictionValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
  },
  predictionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: '8px',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  confidenceBar: {
    height: '4px',
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, rgba(241, 205, 122, 0.95), rgba(127, 211, 157, 0.85))',
  },
  exitCard: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    background: 'linear-gradient(145deg, rgba(18, 15, 10, 0.92) 0%, rgba(10, 9, 7, 0.84) 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  exitRoutes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  exitPlan: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  exitLabel: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
  },
  routeTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  routeTag: {
    padding: '4px 8px',
    borderRadius: '999px',
    background: 'rgba(241, 205, 122, 0.1)',
    color: 'var(--accent-primary)',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
  },
  exitText: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.55,
  },
  summaryBox: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(127, 211, 157, 0.16)',
    background: 'linear-gradient(135deg, rgba(127, 211, 157, 0.08) 0%, rgba(26, 50, 33, 0.12) 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  summaryLabel: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--accent-success)',
  },
  summaryText: {
    fontSize: '12px',
    lineHeight: 1.55,
    color: 'var(--text-primary)',
  },
}
