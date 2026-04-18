import React from 'react'
import { Activity, Zap, Sun, Moon } from 'lucide-react'

const PHASE_LABELS = {
  pre_event:   { label: 'PRE-EVENT',   color: 'var(--accent-primary)' },
  in_progress: { label: 'LIVE',        color: 'var(--accent-success)' },
  halftime:    { label: 'HALFTIME',    color: 'var(--accent-warning)' },
  post_event:  { label: 'POST-MATCH',  color: 'var(--accent-danger)' },
}

export default function Header({ tick, phase, density, running, theme = 'dark', onToggleTheme }) {
  const phaseInfo = PHASE_LABELS[phase] || { label: 'STANDBY', color: '#7a9ab0' }

  return (
    <header style={styles.header}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <Zap size={18} color="var(--accent-primary)" />
        </div>
        <div>
          <div style={styles.logoText}>VENUE<span style={{ color: 'var(--accent-primary)' }}>NEXUS</span></div>
          <div style={styles.logoSub}>Intelligent Crowd Control System</div>
        </div>
      </div>

      {/* Center stats */}
      <div style={styles.centerStats}>
        <Stat label="TICK" value={String(tick).padStart(4, '0')} mono />
        <div style={styles.divider} />
        <Stat label="DENSITY" value={`${Math.round((density || 0) * 100)}%`} mono
          color={density > 0.8 ? 'var(--accent-danger)' : density > 0.5 ? 'var(--accent-warning)' : 'var(--accent-success)'} />
        <div style={styles.divider} />
        <div style={styles.phaseTag}>
          <span style={{ ...styles.phaseDot, background: phaseInfo.color,
            boxShadow: running ? `0 0 8px ${phaseInfo.color}` : 'none' }} />
          <span style={{ ...styles.phaseLabel, color: phaseInfo.color }}>{phaseInfo.label}</span>
        </div>
      </div>

      {/* Live indicator */}
      <div style={styles.liveWrap}>
        <Activity size={14} color={running ? 'var(--accent-success)' : '#3d5a70'} />
        <span style={{ ...styles.liveText, color: running ? 'var(--accent-success)' : '#3d5a70' }}>
          {running ? 'LIVE' : 'PAUSED'}
        </span>
        <button type="button" style={styles.themeToggle} onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </header>
  )
}

function Stat({ label, value, mono, color }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        color: color || 'var(--text-primary)' }}>{value || '—'}</div>
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--spacing-xl)',
    height: 84,
    background: 'var(--shell-header)',
    borderBottom: '1px solid rgba(241, 205, 122, 0.18)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 242, 216, 0.08)',
    backdropFilter: 'blur(22px)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius)',
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#130e07',
    boxShadow: '0 0 0 1px rgba(241, 205, 122, 0.2), 0 8px 20px rgba(146, 98, 17, 0.24)',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: 1.2,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
  },
  logoSub: {
    fontSize: 12,
    color: 'var(--text-muted)',
    letterSpacing: '0.01em',
    fontWeight: 500,
  },
  centerStats: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)' },
  stat: { textAlign: 'center' },
  statLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    marginBottom: 'var(--spacing-xs)',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '0.01em',
    fontFamily: 'var(--font-mono)',
  },
  divider: {
    width: 1,
    height: 32,
    background: 'rgba(241, 205, 122, 0.16)',
  },
  phaseTag: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'block',
    transition: 'var(--transition)',
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.02em',
    fontFamily: 'var(--font-display)',
  },
  liveWrap: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' },
  liveText: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.02em',
    fontFamily: 'var(--font-display)',
  },
  themeToggle: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-primary)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
  },
}
