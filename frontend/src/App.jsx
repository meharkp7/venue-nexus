import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import VenueMap from './components/VenueMap'
import AlertPanel from './components/AlertPanel'
import NudgePanel from './components/NudgePanel'
import AgentConsole from './components/AgentConsole'
import DensityChart from './components/DensityChart'
import SimControls from './components/SimControls'
import RoutePanel from './components/RoutePanel'
import NodeTable from './components/NodeTable'
import KpiDashboard from './components/KpiDashboard'
import ForecastPanel from './components/ForecastPanel'
import ActionsPanel from './components/ActionsPanel'
import WhatIfPanel from './components/WhatIfPanel'
import DecisionLog from './components/DecisionLog'
import SystemHealthBar from './components/SystemHealthBar'
import { useSimulation } from './hooks/useSimulation'
import { api } from './services/api'
import { MessageCircle, X, Sparkles, Zap, Shield, Sun, Moon, Presentation } from 'lucide-react'

const PAGES = [
  { key: 'overview', label: 'Overview', description: 'Live venue map, simulation controls, and trend forecasts.' },
  { key: 'analytics', label: 'Analytics', description: 'Density metrics, KPIs, node status, and decision history.' },
  { key: 'control', label: 'Control Center', description: 'Alert management, attendee nudges, route optimization, and responses.' },
]

const DEMO_STEPS = ['normal', 'spike', 'prediction', 'action', 'stabilized']

function scaleDensity(base, multiplier, floor = 0.08, ceiling = 0.98) {
  return Math.max(floor, Math.min(ceiling, Number((base * multiplier).toFixed(3))))
}

function getDemoTargetNode(nodes = []) {
  if (!nodes.length) return null
  return [...nodes].sort((a, b) => b.density - a.density)[0]
}

function buildDemoState(state, stage) {
  if (!state || !stage) return state
  const baseNodes = Array.isArray(state.nodes) ? state.nodes : []
  const baseEdges = Array.isArray(state.edges) ? state.edges : []
  const baseForecasts = Array.isArray(state.forecasts) ? state.forecasts : []
  const baseNudges = Array.isArray(state.nudges) ? state.nudges : []
  const baseRoutes = Array.isArray(state.routes) ? state.routes : []

  const target = getDemoTargetNode(baseNodes)
  if (!target) return state

  const neighbor = baseNodes.find(node => node.id !== target.id) || target
  const mapNode = (node) => {
    if (stage === 'normal') {
      const density = scaleDensity(node.density, 0.58, 0.06, 0.48)
      return {
        ...node,
        density,
        status: density >= 0.8 ? 'red' : density >= 0.5 ? 'yellow' : 'green',
        trend: 'stable',
        predicted_density: density,
        forecast_confidence: 0.93,
        risk_level: null,
      }
    }

    if (node.id !== target.id) {
      const density = stage === 'stabilized'
        ? scaleDensity(node.density, 0.76, 0.1, 0.52)
        : stage === 'spike'
          ? scaleDensity(node.density, 0.9, 0.1, 0.62)
          : scaleDensity(node.density, 0.82, 0.1, 0.58)
      return {
        ...node,
        density,
        status: density >= 0.8 ? 'red' : density >= 0.5 ? 'yellow' : 'green',
        trend: stage === 'stabilized' ? 'falling' : 'stable',
        predicted_density: stage === 'stabilized' ? density * 0.92 : density,
        forecast_confidence: 0.88,
        risk_level: density >= 0.8 ? 'high' : density >= 0.5 ? 'medium' : null,
      }
    }

    if (stage === 'spike') {
      return {
        ...node,
        density: 0.86,
        status: 'red',
        trend: 'rising',
        predicted_density: 0.93,
        forecast_confidence: 0.91,
        risk_level: 'critical',
      }
    }

    if (stage === 'prediction') {
      return {
        ...node,
        density: 0.72,
        status: 'yellow',
        trend: 'rising',
        predicted_density: 0.92,
        forecast_confidence: 0.94,
        risk_level: 'high',
      }
    }

    if (stage === 'action') {
      return {
        ...node,
        density: 0.78,
        status: 'yellow',
        trend: 'falling',
        predicted_density: 0.61,
        forecast_confidence: 0.9,
        risk_level: 'high',
      }
    }

    return {
      ...node,
      density: 0.44,
      status: 'green',
      trend: 'falling',
      predicted_density: 0.28,
      forecast_confidence: 0.95,
      risk_level: null,
    }
  }

  const nodes = baseNodes.map(mapNode)
  const targetNode = nodes.find(node => node.id === target.id) || target
  const overallDensity = Number((nodes.reduce((sum, node) => sum + node.density, 0) / Math.max(nodes.length, 1)).toFixed(3))

  const baseAlert = {
    node_id: targetNode.id,
    node_name: targetNode.name,
    density: targetNode.density,
    alert_level: stage === 'spike' ? 'critical' : stage === 'prediction' || stage === 'action' ? 'high' : 'low',
    predicted_surge_in_minutes: stage === 'prediction' ? 3 : stage === 'spike' ? 1 : null,
    confidence: stage === 'prediction' ? 0.94 : stage === 'spike' ? 0.91 : stage === 'action' ? 0.89 : 0.76,
    uncertainty_band: stage === 'stabilized' ? 0.04 : 0.08,
  }

  const forecasts = nodes.slice(0, 6).map(node => {
    const isTarget = node.id === targetNode.id
    const horizon15 = isTarget
      ? stage === 'normal' ? Math.min(0.48, node.density + 0.03)
      : stage === 'spike' ? 0.96
      : stage === 'prediction' ? 0.92
      : stage === 'action' ? 0.61
      : 0.28
      : stage === 'stabilized' ? Math.max(0.2, node.density - 0.06) : Math.min(0.7, node.density + 0.04)
    const matchingForecast = baseForecasts.find(forecast => forecast?.node_id === node.id)
    return {
      ...(matchingForecast || {}),
      node_id: node.id,
      node_name: node.name,
      current_density: node.density,
      forecast_5min: Number((isTarget && stage !== 'stabilized' ? Math.min(0.88, node.density + 0.06) : Math.max(0.18, node.density - 0.03)).toFixed(3)),
      forecast_15min: Number(horizon15.toFixed(3)),
      forecast_30min: Number((stage === 'stabilized' ? Math.max(0.16, horizon15 - 0.08) : Math.min(0.98, horizon15 + 0.04)).toFixed(3)),
      confidence: isTarget ? 0.94 : 0.82,
      uncertainty: isTarget ? 0.06 : 0.08,
      trend: isTarget ? node.trend === 'rising' ? 'rising' : node.trend === 'falling' ? 'falling' : 'stable' : (stage === 'stabilized' ? 'falling' : 'stable'),
    }
  })

  const demoAction = {
    id: 'demo-action',
    action_type: 'redirect_flow',
    target_node: targetNode.id,
    target_node_name: targetNode.name,
    description: `Redirect 20% traffic from ${targetNode.name} and open auxiliary flow via ${neighbor.name}.`,
    priority: 1,
    confidence: 0.92,
    reasoning: `${targetNode.name} is approaching a critical density breach. Immediate rerouting and operator intervention prevents the next surge window from compounding.`,
    estimated_impact: 'Reduce density by 22% within 4 minutes and restore balanced circulation.',
    expected_impact_percent: 22,
    eta_minutes: 4,
    requires_approval: true,
    approved: stage === 'stabilized',
    executed: stage === 'stabilized',
  }

  const nudges = stage === 'action' || stage === 'stabilized'
    ? [{
        target_sector: targetNode.name,
        message: `Redirect 20% traffic from ${targetNode.name} toward ${neighbor.name}; congestion prevention is now active.`,
        redirect_to: neighbor.name,
        incentive: 'Express routing activated',
        urgency: 'high',
      }]
    : baseNudges

  const routes = stage === 'action' || stage === 'stabilized'
    ? [{
        from_node: targetNode.name,
        to_node: neighbor.name,
        recommended_path: [targetNode.name, 'Dynamic corridor', neighbor.name],
        estimated_time_minutes: stage === 'stabilized' ? 2.5 : 3.5,
        reason: stage === 'stabilized'
          ? 'Load rebalanced and congestion normalized after redirect.'
          : 'Fastest low-density reroute for immediate pressure relief.',
        cost_breakdown: { safety: 0.22, congestion: 0.18, travel: 0.11 },
      }]
    : baseRoutes

  return {
    ...state,
    overall_density,
    event_phase: stage === 'normal' ? 'pre_event' : stage === 'stabilized' ? 'post_event' : 'in_progress',
    nodes,
    edges: baseEdges.map(edge => ({
      ...edge,
      utilization: stage === 'normal' ? Math.min(0.22, edge.utilization || 0.12) :
        stage === 'spike' ? Math.max(0.78, edge.utilization || 0.72) :
        stage === 'prediction' ? Math.max(0.62, edge.utilization || 0.58) :
        stage === 'action' ? Math.max(0.48, edge.utilization || 0.4) :
        Math.min(0.3, edge.utilization || 0.26),
      is_saturated: stage === 'spike' ? true : stage === 'prediction' ? edge.is_saturated || edge.source === targetNode.id || edge.target === targetNode.id : false,
    })),
    alerts: stage === 'normal' ? [] : stage === 'stabilized' ? [] : [baseAlert],
    forecasts,
    actions: stage === 'normal' || stage === 'spike' ? [] : [demoAction],
    nudges,
    routes,
  }
}

function getDemoNarrative(stepKey) {
  const map = {
    normal: 'Start with a calm venue baseline and show operators the control surface in nominal conditions.',
    spike: 'Trigger a visible congestion spike so judges immediately see the operational risk appear on the map.',
    prediction: 'Show the AI prediction before the situation worsens so the story stays prevention-first.',
    action: 'Present the recommended intervention, approve it, and explain the predicted impact and ETA.',
    stabilized: 'Close the loop with a stabilized venue, lower density, and a clear success outcome.',
  }
  return map[stepKey] || map.normal
}

export default function App() {
  const [activePage, setActivePage] = useState('overview')
  const { state, tick, running, error, loading, setRunning, handleReset, stepOnce } = useSimulation()
  const [theme, setTheme] = useState(() => localStorage.getItem('venue-nexus-theme') || 'dark')
  const [demoMode, setDemoMode] = useState(false)
  const [demoStepIndex, setDemoStepIndex] = useState(0)
  const [demoPreparing, setDemoPreparing] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('venue-nexus-theme', theme)
  }, [theme])

  const displayState = useMemo(() => {
    if (!demoMode) return state
    try {
      return buildDemoState(state, DEMO_STEPS[demoStepIndex] || 'normal')
    } catch (e) {
      console.error('Demo mode render fallback:', e)
      return state
    }
  }, [state, demoMode, demoStepIndex])
  const currentDemoStep = DEMO_STEPS[demoStepIndex] || 'normal'
  const currentDemoNarrative = getDemoNarrative(currentDemoStep)

  const alerts    = displayState?.alerts    || []
  const nudges    = displayState?.nudges    || []
  const routes    = displayState?.routes    || []
  const nodes     = displayState?.nodes     || []
  const edges     = displayState?.edges     || []
  const forecasts = displayState?.forecasts || []
  const actions   = displayState?.actions   || []
  const kpis      = displayState?.kpis      || null
  const phase     = displayState?.event_phase
  const density   = displayState?.overall_density

  const handleApproveAction = async (actionId) => {
    if (demoMode && actionId === 'demo-action') {
      setDemoStepIndex(4)
      return
    }
    try {
      await api.approveAction(actionId, true)
    } catch (e) {
      console.error('Approve failed:', e)
    }
  }

  const handleOverrideAction = async (actionId) => {
    try {
      await api.approveAction(actionId, false, 'Operator override')
    } catch (e) {
      console.error('Override failed:', e)
    }
  }

  const handleExecuteAction = async (actionId) => {
    if (demoMode && actionId === 'demo-action') {
      setDemoStepIndex(4)
      return
    }
    try {
      await api.executeAction(actionId)
    } catch (e) {
      console.error('Execute failed:', e)
    }
  }

  const selectedPage = PAGES.find(page => page.key === activePage) || PAGES[0]
  const [consoleOpen, setConsoleOpen] = useState(false)

  const startDemo = async () => {
    setDemoMode(true)
    setDemoStepIndex(0)
    setActivePage('overview')
    setDemoPreparing(true)
    await handleReset()
    setDemoPreparing(false)
  }

  const nextDemoStep = () => {
    setDemoMode(true)
    setDemoStepIndex(prev => Math.min(prev + 1, DEMO_STEPS.length - 1))
  }

  const jumpDemoStep = (stepKey) => {
    setDemoMode(true)
    setDemoStepIndex(Math.max(0, DEMO_STEPS.indexOf(stepKey)))
  }

  const stopDemo = () => {
    setDemoMode(false)
    setDemoStepIndex(0)
  }

  const renderPageContent = () => {
    if (activePage === 'analytics') {
      return (
        <div style={styles.pageGrid}>
          <div style={styles.pageColumn}>
            <DensityChart density={density} phase={phase} tick={tick} />
            <KpiDashboard kpis={kpis} />
            <NodeTable nodes={nodes} />
          </div>
          <div style={styles.pageColumn}> 
            <ForecastPanel forecasts={forecasts} />
            <DecisionLog />
          </div>
        </div>
      )
    }

    if (activePage === 'control') {
      return (
        <div style={styles.pageGrid}>
          <div style={styles.pageColumn}>
            <AlertPanel alerts={alerts} />
            <NudgePanel nudges={nudges} />
          </div>
          <div style={styles.pageColumn}>
            <RoutePanel routes={routes} />
            <ActionsPanel
              actions={actions}
              onApprove={handleApproveAction}
              onExecute={handleExecuteAction}
              onOverride={handleOverrideAction}
            />
            <WhatIfPanel />
          </div>
        </div>
      )
    }

    return (
      <div style={styles.pageGrid}>
        <div style={styles.pageColumnWide}>
          <VenueMap nodes={nodes} edges={edges} />
        </div>
        <div style={styles.pageColumn}>
          <SimControls
            running={running} loading={loading} tick={tick}
            phase={phase}
            density={density}
            alerts={alerts}
            actions={actions}
            onPlay={() => setRunning(true)}
            onPause={() => setRunning(false)}
            onReset={handleReset}
            onStep={stepOnce}
          />
          <ForecastPanel forecasts={forecasts} />
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={
          <div style={styles.root}>
            <Header
              tick={tick}
              phase={phase}
              density={density}
              running={running}
              theme={theme}
              onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            />

            <SystemHealthBar />

            {error && (
              <div style={styles.errorBanner}>
                ⚠ {error} — Is the backend running on port 8000?
              </div>
            )}

            <div style={styles.dashboardWrapper}>
              <div style={styles.pageHeader}>
                <div>
                  <div style={styles.pageLabel}>
                    <Sparkles size={12} style={{ marginRight: 4 }} />
                    {demoMode ? 'GUIDED DEMO' : 'WORKSPACE'}
                  </div>
                  <h2 style={styles.pageTitle}>{selectedPage.label}</h2>
                  <p style={styles.pageDescription}>{selectedPage.description}</p>
                  {demoMode && <p style={styles.demoNarrative}>{currentDemoNarrative}</p>}
                </div>
                <div style={styles.headerActions}>
                  <div style={styles.demoPanel}>
                    <button type="button" style={demoMode ? styles.demoButtonActive : styles.demoButton} onClick={startDemo}>
                      <Presentation size={14} style={{ marginRight: 6 }} />
                      Demo Mode
                    </button>
                    {demoMode && (
                      <>
                        <button type="button" style={styles.demoStageButton} onClick={() => jumpDemoStep('spike')}>Trigger Spike</button>
                        <button type="button" style={styles.demoStageButton} onClick={() => jumpDemoStep('prediction')}>Show Prediction</button>
                        <button type="button" style={styles.demoStageButton} onClick={() => jumpDemoStep('action')}>Apply Action</button>
                        <button type="button" style={styles.demoStageButton} onClick={() => jumpDemoStep('stabilized')}>Stabilize</button>
                        <button type="button" style={styles.demoStageButton} onClick={nextDemoStep}>Next Beat</button>
                        <button type="button" style={styles.demoStageButtonMuted} onClick={stopDemo}>Exit Demo</button>
                      </>
                    )}
                  </div>
                  <button type="button" style={styles.themeButton} onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun size={14} style={{ marginRight: 6 }} /> : <Moon size={14} style={{ marginRight: 6 }} />}
                    {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                  </button>
                </div>
                <div style={styles.pageTabs}>
                  {PAGES.map(page => (
                    <button
                      key={page.key}
                      type="button"
                      onClick={() => setActivePage(page.key)}
                      style={activePage === page.key ? styles.tabButtonActive : styles.tabButton}
                    >
                      {page.key === 'overview' && <Zap size={14} style={{ marginRight: 6 }} />}
                      {page.key === 'analytics' && <Shield size={14} style={{ marginRight: 6 }} />}
                      {page.key === 'control' && <Sparkles size={14} style={{ marginRight: 6 }} />}
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>

              {demoMode && (
                <div style={styles.demoBanner}>
                  <div style={styles.demoBannerLeft}>
                    <div style={styles.demoBannerLabel}>
                      <Presentation size={14} style={{ marginRight: 6 }} />
                      Demo Mode Active
                    </div>
                    <div style={styles.demoBannerTitle}>
                      {demoPreparing ? 'Preparing normal-state baseline...' : `Current beat: ${currentDemoStep.toUpperCase()}`}
                    </div>
                    <div style={styles.demoBannerText}>
                      {demoPreparing
                        ? 'The guided demo is resetting the venue so the story starts from a clean baseline.'
                        : currentDemoNarrative}
                    </div>
                  </div>
                  <div style={styles.demoBannerSteps}>
                    {DEMO_STEPS.map((step, index) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => jumpDemoStep(step)}
                        style={index === demoStepIndex ? styles.demoBeatActive : styles.demoBeat}
                      >
                        <span style={styles.demoBeatIndex}>0{index + 1}</span>
                        <span>{step}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {renderPageContent()}
            </div>

            <div style={styles.chatLauncher}>
              <button style={styles.chatButton} onClick={() => setConsoleOpen(prev => !prev)}>
                <MessageCircle size={18} />
              </button>
              <span style={styles.chatLabel}>Agent Console</span>
            </div>

            {consoleOpen && (
              <div style={styles.consoleOverlay}>
                <div style={styles.consoleHeader}>
                  <div style={styles.consoleTitle}>Agent Console</div>
                  <button style={styles.consoleClose} onClick={() => setConsoleOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
                <AgentConsole />
              </div>
            )}
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--shell-bg)',
    backgroundSize: '140% 140%',
    animation: 'gradientShift 20s ease infinite',
    fontFamily: 'var(--font-body)',
    position: 'relative',
  },
  errorBanner: {
    background: 'linear-gradient(135deg, rgba(86, 24, 24, 0.36) 0%, rgba(43, 10, 10, 0.66) 100%)',
    border: '1px solid rgba(240, 106, 106, 0.24)',
    color: 'var(--accent-danger)',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: 'var(--radius)',
    margin: '12px 16px 0',
    animation: 'fadeIn 0.3s ease-out',
    boxShadow: '0 16px 30px rgba(0, 0, 0, 0.22)',
  },
  dashboardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px var(--spacing-xl) 0',
    maxWidth: '1860px',
    margin: '0 auto',
    width: '100%',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '24px',
    padding: '24px 28px',
    borderRadius: 'var(--radius-xl)',
    background: 'var(--shell-panel)',
    border: '1px solid rgba(241, 205, 122, 0.24)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 243, 213, 0.1)',
    backdropFilter: 'blur(22px)',
    animation: 'headerGlow 3s ease-in-out infinite',
  },
  pageLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.16em',
    color: 'var(--accent-warning)',
    marginBottom: '6px',
  },
  pageTitle: {
    margin: 0,
    fontSize: 32,
    color: 'var(--text-primary)',
    letterSpacing: '-0.04em',
    fontFamily: 'var(--font-display)',
  },
  pageDescription: {
    margin: '10px 0 0',
    maxWidth: 560,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  demoNarrative: {
    margin: '12px 0 0',
    maxWidth: 620,
    color: 'var(--accent-primary)',
    lineHeight: 1.6,
    fontWeight: 600,
  },
  demoBanner: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: '18px',
    padding: '20px 22px',
    borderRadius: 'var(--radius-xl)',
    background: 'linear-gradient(145deg, rgba(241, 205, 122, 0.12) 0%, rgba(92, 61, 13, 0.12) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.2)',
    boxShadow: 'var(--shadow-md)',
  },
  demoBannerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  demoBannerLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--accent-primary)',
  },
  demoBannerTitle: {
    fontSize: 20,
    fontFamily: 'var(--font-display)',
    color: 'var(--text-primary)',
  },
  demoBannerText: {
    fontSize: 13,
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
    maxWidth: 620,
  },
  demoBannerSteps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: '8px',
    alignItems: 'stretch',
  },
  demoBeat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: 700,
  },
  demoBeatActive: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid rgba(241, 205, 122, 0.28)',
    background: 'rgba(241, 205, 122, 0.14)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: 800,
    boxShadow: '0 0 20px rgba(241, 205, 122, 0.08)',
  },
  demoBeatIndex: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent-primary)',
  },
  pageTabs: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  demoPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  demoButton: {
    border: '1px solid rgba(241, 205, 122, 0.24)',
    borderRadius: '999px',
    background: 'var(--shell-chip)',
    color: 'var(--text-secondary)',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
  },
  demoButtonActive: {
    border: '1px solid rgba(255, 226, 166, 0.36)',
    borderRadius: '999px',
    background: 'var(--shell-chip-active)',
    color: '#140f08',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
  },
  demoStageButton: {
    border: '1px solid rgba(241, 205, 122, 0.22)',
    borderRadius: '999px',
    background: 'rgba(241, 205, 122, 0.08)',
    color: 'var(--accent-primary)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
  },
  demoStageButtonMuted: {
    border: '1px solid var(--border)',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.02)',
    color: 'var(--text-secondary)',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
  },
  themeButton: {
    border: '1px solid rgba(241, 205, 122, 0.22)',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-secondary)',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
  },
  tabButton: {
    border: '1px solid rgba(241, 205, 122, 0.24)',
    borderRadius: '999px',
    background: 'var(--shell-chip)',
    color: 'var(--text-secondary)',
    padding: '10px 18px',
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 242, 216, 0.06)',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
  },
  tabButtonActive: {
    border: '1px solid rgba(255, 226, 166, 0.36)',
    borderRadius: '999px',
    background: 'var(--shell-chip-active)',
    color: '#140f08',
    padding: '10px 18px',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 18px 36px rgba(156, 105, 18, 0.34), 0 0 24px rgba(241, 205, 122, 0.14)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    animation: 'tabPulse 2s ease-in-out infinite',
  },
  pageGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '20px',
    alignItems: 'start',
  },
  pageColumn: {
    display: 'grid',
    gap: '20px',
  },
  pageColumnWide: {
    display: 'grid',
    gap: '20px',
    minWidth: 0,
  },
  chatLauncher: {
    position: 'fixed',
    right: 28,
    bottom: 28,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    zIndex: 120,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: '1px solid rgba(255, 226, 166, 0.36)',
    background: 'linear-gradient(135deg, #f8dfa2 0%, #d09c34 46%, #8e5a0a 100%)',
    color: '#140f08',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.34), 0 0 28px rgba(241, 205, 122, 0.16)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    animation: 'chatPulse 2s ease-in-out infinite',
  },
  chatLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    background: 'rgba(13, 11, 8, 0.86)',
    padding: '10px 14px',
    borderRadius: '999px',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    boxShadow: '0 14px 34px rgba(0, 0, 0, 0.26)',
    backdropFilter: 'blur(14px)',
  },
  consoleOverlay: {
    position: 'fixed',
    right: 28,
    bottom: 96,
    width: 380,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 140px)',
    background: 'var(--shell-overlay)',
    border: '1px solid rgba(241, 205, 122, 0.2)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 28px 60px rgba(0, 0, 0, 0.42), inset 0 1px 1px rgba(255, 246, 224, 0.08)',
    padding: '18px',
    zIndex: 130,
    backdropFilter: 'blur(24px)',
  },
  consoleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  consoleTitle: {
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  consoleClose: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    background: 'rgba(28, 20, 12, 0.82)',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--text-primary)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.28)',
  },
}
