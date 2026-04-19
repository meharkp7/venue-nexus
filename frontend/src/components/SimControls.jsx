import React from 'react'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'

const PHASE_PROGRESS = {
  pre_event:   10,
  in_progress: 45,
  halftime:    60,
  post_event:  90,
}

export default function SimControls({ running, loading, tick, phase, density, alerts = [], actions = [], onPlay, onPause, onReset, onStep }) {
  const progress = PHASE_PROGRESS[phase] || 0
  const storyline = [
    'Normal state',
    'Congestion spike',
    'Prediction issued',
    'AI suggests actions',
    'System stabilizes',
  ]
  const activeStage = (() => {
    if (actions.some(action => action.executed || action.approved)) return 4
    if (actions.length > 0) return 3
    if (alerts.some(alert => alert.predicted_surge_in_minutes != null)) return 2
    if ((density || 0) > 0.65 || alerts.length > 0) return 1
    return 0
  })()

  return (
    <section
      style={styles.wrap}
      className="card widget-float"
      aria-label="Live simulation controls"
      aria-live="polite"
    >
      <div style={styles.progressWrap}>
        <div
          style={styles.progressBar}
          role="progressbar"
          aria-label="Event progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          <div style={{ ...styles.progressThumb, left: `${progress}%` }} />
        </div>
        <div style={styles.phaseRow}>
          {['PRE', 'MATCH', 'HALF', 'POST'].map((p, i) => (
            <span key={i} style={{ ...styles.phaseMarker,
              color: progress >= i * 30 ? '#FFD700' : 'var(--text-muted)' }}>{p}</span>
          ))}
        </div>
      </div>

      <div style={styles.controls}>
        <button style={styles.btn} onClick={onReset} title="Reset" aria-label="Reset simulation">
          <RotateCcw size={14} color="var(--text-secondary)" />
        </button>

        <button style={styles.btn} onClick={onStep} disabled={running || loading} title="Step once" aria-label="Advance simulation by one step">
          <SkipForward size={14} color={running ? 'var(--text-muted)' : 'var(--text-secondary)'} />
        </button>

        {running ? (
          <button style={{ ...styles.btn, ...styles.primaryBtn }} onClick={onPause} aria-label="Pause live simulation">
            <Pause size={15} color="#080c10" />
            <span>PAUSE</span>
          </button>
        ) : (
          <button style={{ ...styles.btn, ...styles.primaryBtn, background: 'rgba(212, 175, 55, 0.14)',
            borderColor: 'rgba(212, 175, 55, 0.28)', color: '#D4AF37' }} onClick={onPlay} aria-label="Start live simulation">
            <Play size={15} color="#FFD700" />
            <span style={{ color: '#FFD700' }}>SIMULATE</span>
          </button>
        )}

        <div style={styles.tickDisplay} role="status" aria-label={`Current tick ${tick}`}>
          <span style={styles.tickLabel}>TICK</span>
          <span style={styles.tickValue}>{String(tick).padStart(4, '0')}</span>
        </div>
      </div>

      <div style={styles.storySection}>
        <div style={styles.storyLabel}>Demo Flow</div>
        <div style={styles.storyline}>
          {storyline.map((stepLabel, index) => (
            <div key={stepLabel} style={{
              ...styles.storyStep,
              ...(index <= activeStage ? styles.storyStepActive : {}),
            }}>
              <span style={styles.storyIndex}>0{index + 1}</span>
              <span>{stepLabel}</span>
            </div>
          ))}
        </div>
        <div style={styles.powerLine}>
          “VenueNexus doesn’t react to congestion — it prevents it.”
        </div>
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
  progressWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)',
  },
  progressBar: {
    height: 6,
    background: 'var(--bg-hover)',
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
    borderRadius: 3,
    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  progressThumb: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#FFD700',
    position: 'absolute',
    top: -3,
    transform: 'translateX(-50%)',
    boxShadow: '0 0 0 1px rgba(255, 215, 0, 0.35), 0 0 16px rgba(255, 215, 0, 0.2)',
    transition: 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  phaseRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  phaseMarker: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.02em',
    transition: 'color 0.3s',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    marginTop: '14px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius)',
    padding: '10px 16px',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.02em',
    color: 'var(--text-primary)',
    transition: 'var(--transition)',
    boxShadow: 'var(--shadow-sm)',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
    borderColor: '#D4AF37',
    color: 'white',
    boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.3), 0 0 16px rgba(212, 175, 55, 0.2)',
  },
  tickDisplay: {
    marginLeft: 'auto',
    textAlign: 'right',
  },
  tickLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    display: 'block',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  tickValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 18,
    fontWeight: 600,
    color: '#FFD700',
  },
  storySection: {
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  storyLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  storyline: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: '6px',
  },
  storyStep: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontSize: 10,
    transition: 'var(--transition)',
  },
  storyStepActive: {
    color: 'var(--text-primary)',
    background: 'rgba(241, 205, 122, 0.08)',
    border: '1px solid rgba(241, 205, 122, 0.24)',
    boxShadow: '0 0 18px rgba(241, 205, 122, 0.08)',
  },
  storyIndex: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent-primary)',
    fontWeight: 700,
  },
  powerLine: {
    fontSize: 11,
    lineHeight: 1.6,
    color: 'var(--accent-primary)',
    fontWeight: 700,
  },
}
