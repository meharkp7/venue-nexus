import React, { useState } from 'react'
import { FlaskConical, ChevronRight, ArrowRight, Play, BarChart3 } from 'lucide-react'
import { api } from '../services/api'

const PRESET_SCENARIOS = [
  'Close Gate A',
  'Redirect 20% traffic',
  'What if we close Gate A during halftime?',
  'What if we redirect 30% traffic from North Concourse?',
  'What if we activate emergency exits?',
  'What if we offer 20% discount at South Concession?',
  'What if we open auxiliary staff routes?',
]

const RISK_COLOR = {
  low: 'var(--accent-success)',
  medium: 'var(--accent-warning)',
  high: 'var(--accent-danger)',
}

export default function WhatIfPanel() {
  const [scenarios, setScenarios] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentDensity, setCurrentDensity] = useState(null)
  const [selected, setSelected] = useState(null)
  const [customQuery, setCustomQuery] = useState('')

  const runSimulation = async (query = null) => {
    setLoading(true)
    try {
      const data = await api.runWhatIf(query)
      setScenarios(data.scenarios)
      setCurrentDensity(data.current_density)
    } catch (e) {
      console.error('What-if failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handlePresetScenario = (scenario) => {
    runSimulation(scenario)
  }

  const handleCustomScenario = () => {
    if (customQuery.trim()) {
      runSimulation(customQuery.trim())
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <FlaskConical size={12} color="var(--accent-violet)" />
        <span style={styles.title}>WHAT-IF SIMULATION</span>
        <button style={styles.runBtn} onClick={runSimulation} disabled={loading}>
          {loading ? '⏳ Simulating...' : '▶ Simulate Action'}
        </button>
      </div>

      {/* Preset Scenarios */}
      {!scenarios && !loading && (
        <div style={styles.presetSection}>
          <div style={styles.presetHeader}>
            <BarChart3 size={12} color="var(--accent-violet)" />
            <span>Quick Scenarios</span>
          </div>
          <div style={styles.presetGrid}>
            {PRESET_SCENARIOS.map((scenario, i) => (
              <button
                key={i}
                style={styles.presetBtn}
                onClick={() => handlePresetScenario(scenario)}
                disabled={loading}
              >
                {scenario}
              </button>
            ))}
          </div>
          
          {/* Custom Query Input */}
          <div style={styles.customSection}>
            <div style={styles.customHeader}>Custom Scenario</div>
            <div style={styles.customInputRow}>
              <input
                style={styles.customInput}
                placeholder="What if we...?"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomScenario()
                }}
              />
              <button
                style={styles.customRunBtn}
                onClick={handleCustomScenario}
                disabled={loading || !customQuery.trim()}
              >
                <Play size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {scenarios && (
        <div>
          {/* Current State Summary */}
          <div style={styles.currentState}>
            <div style={styles.stateLabel}>CURRENT DENSITY</div>
            <div style={styles.stateValue}>{Math.round(currentDensity * 100)}%</div>
            <div style={styles.predictedImpactLabel}>Predicted impact shown below</div>
            <button 
              style={styles.newSimBtn}
              onClick={() => {
                setScenarios(null)
                setSelected(null)
              }}
            >
              ← New Simulation
            </button>
          </div>
          
          {/* Scenarios List */}
          <div style={styles.scenarioList}>
            {scenarios.map((s, i) => {
              const riskColor = RISK_COLOR[s.risk_level] || '#7a9ab0'
              const isSelected = selected === i
              const improvementColor = s.improvement_pct > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'

              return (
                <div key={i}
                  style={{
                    ...styles.scenarioCard,
                    borderColor: isSelected ? 'var(--border-light)' : 'var(--border)',
                    background: isSelected ? 'var(--bg-card-alt)' : 'var(--bg-panel)',
                  }}
                  className="fade-in"
                  onClick={() => setSelected(isSelected ? null : i)}
                >
                  <div style={styles.scenarioTop}>
                    <div style={styles.scenarioName}>{s.scenario_name}</div>
                    <span style={{
                      ...styles.riskBadge,
                      color: riskColor,
                      background: `${riskColor}12`,
                      border: `1px solid ${riskColor}30`,
                    }}>
                      {s.risk_level.toUpperCase()}
                    </span>
                  </div>

                  <div style={styles.scenarioDesc}>{s.description}</div>

                  <div style={styles.densityComparison}>
                    <div style={styles.densityRow}>
                      <span style={styles.densityLabel}>Before</span>
                      <span style={styles.densityValue}>{Math.round(s.density_before * 100)}%</span>
                    </div>
                    <ArrowRight size={12} color={improvementColor} />
                    <div style={styles.densityRow}>
                      <span style={styles.densityLabel}>After</span>
                      <span style={{ ...styles.densityValue, color: improvementColor }}>
                        {Math.round(s.density_after * 100)}%
                      </span>
                    </div>
                    <span style={{
                      ...styles.improvementBadge,
                      color: improvementColor,
                      background: `${improvementColor}12`,
                    }}>
                      Predicted impact {s.improvement_pct > 0 ? '↓' : '↑'} {Math.abs(s.improvement_pct)}%
                    </span>
                  </div>

                  <div style={styles.beforeAfterBar}>
                    <div style={styles.beforeAfterTrack}>
                      <div
                        style={{
                          ...styles.beforeFill,
                          width: `${Math.round(s.density_before * 100)}%`,
                        }}
                      />
                    </div>
                    <div style={styles.beforeAfterTrack}>
                      <div
                        style={{
                          ...styles.afterFill,
                          width: `${Math.round(s.density_after * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div style={styles.simMeta}>
                    <span style={styles.simMetaPill}>ETA {s.eta_minutes ?? 'n/a'}m</span>
                    <span style={styles.simMetaPill}>{s.risk_level.toUpperCase()} risk</span>
                  </div>

                  {isSelected && (
                    <div style={styles.expandedInfo}>
                      <div style={styles.recLabel}>RECOMMENDATION</div>
                      <div style={styles.recText}>{s.recommendation}</div>
                      {s.affected_nodes && s.affected_nodes.length > 0 && (
                        <>
                          <div style={styles.recLabel}>AFFECTED ZONES</div>
                          <div style={styles.zonesList}>
                            {s.affected_nodes.map((node, j) => (
                              <span key={j} style={styles.zoneTag}>{node}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderBottom: '3px solid var(--accent-secondary)',
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
    fontFamily: 'var(--font-display)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    flex: 1,
  },
  runBtn: {
    background: 'linear-gradient(135deg, rgba(241, 205, 122, 0.16) 0%, rgba(177, 124, 31, 0.1) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.22)',
    color: 'var(--accent-primary)',
    padding: '8px 16px',
    borderRadius: 'var(--radius)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.02em',
    transition: 'var(--transition)',
    boxShadow: '0 0 0 1px rgba(241, 205, 122, 0.16)',
  },
  presetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  presetHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em'
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '8px'
  },
  presetBtn: {
    background: 'linear-gradient(135deg, rgba(241, 205, 122, 0.08) 0%, rgba(114, 80, 16, 0.08) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.18)',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '11px',
    color: 'var(--text-primary)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-display)',
    lineHeight: '1.4'
  },
  customSection: {
    borderTop: '1px solid var(--border)',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  customHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em'
  },
  customInputRow: {
    display: 'flex',
    gap: '8px'
  },
  customInput: {
    flex: 1,
    background: 'linear-gradient(135deg, rgba(21, 16, 11, 0.88) 0%, rgba(11, 10, 8, 0.82) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.18)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
    outline: 'none'
  },
  customRunBtn: {
    width: '32px',
    height: '32px',
    background: 'rgba(241, 205, 122, 0.12)',
    border: '1px solid rgba(241, 205, 122, 0.28)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--accent-violet)'
  },
  currentState: {
    background: 'linear-gradient(135deg, rgba(27, 20, 11, 0.8) 0%, rgba(13, 11, 8, 0.86) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  stateLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    letterSpacing: '0.08em'
  },
  stateValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)'
  },
  predictedImpactLabel: {
    fontSize: '10px',
    color: 'var(--accent-primary)',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  newSimBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    marginLeft: 'auto'
  },
  scenarioList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  scenarioCard: {
    padding: '12px',
    borderRadius: 'var(--radius)',
    border: '1px solid',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'all 0.2s',
  },
  scenarioTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  scenarioName: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  riskBadge: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '2px 7px',
    borderRadius: 20,
  },
  scenarioDesc: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    lineHeight: 1.5
  },
  densityComparison: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
  },
  densityRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px'
  },
  densityLabel: {
    fontSize: '9px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  densityValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  improvementBadge: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    padding: '2px 6px',
    borderRadius: 4,
    marginLeft: 'auto',
  },
  beforeAfterBar: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  beforeAfterTrack: {
    height: 8,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  beforeFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, rgba(240,106,106,0.9), rgba(242,183,93,0.85))',
    transition: 'width 0.4s ease',
  },
  afterFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, rgba(127,211,157,0.85), rgba(241,205,122,0.9))',
    transition: 'width 0.4s ease',
  },
  simMeta: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  simMetaPill: {
    fontSize: 9,
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 999,
    padding: '3px 7px',
    fontFamily: 'var(--font-mono)',
  },
  expandedInfo: {
    borderTop: '1px solid var(--border)',
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  recLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-display)',
  },
  recText: {
    fontSize: 11,
    color: 'var(--accent-primary)',
    lineHeight: 1.5,
  },
  zonesList: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  zoneTag: {
    background: 'rgba(241, 205, 122, 0.12)',
    color: 'var(--text-primary)',
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '500',
    fontFamily: 'var(--font-mono)'
  }
}
