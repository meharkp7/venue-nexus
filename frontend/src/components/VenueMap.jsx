import React, { useMemo, useState } from 'react'
import { Camera, ChevronRight, Radar, Waves, Activity, Building2, HeartPulse, ShoppingBag, Landmark, GitBranchPlus } from 'lucide-react'
import { buildVenueFloorplan } from '../utils/venueFloorplan'

const STATUS_COLORS = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
}

export default function VenueMap({ nodes = [], edges = [] }) {
  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [hoveredSensorId, setHoveredSensorId] = useState(null)
  const [activeLevel, setActiveLevel] = useState('all')
  const { zones, corridors, sensors, amenities, circulation } = useMemo(() => buildVenueFloorplan(nodes, edges), [nodes, edges])
  const visibleZones = useMemo(
    () => zones.filter(zone => activeLevel === 'all' || zone.level === activeLevel || zone.level === 'all'),
    [zones, activeLevel],
  )
  const zoneLookup = useMemo(() => Object.fromEntries(zones.map(zone => [zone.id, zone])), [zones])
  const visibleCorridors = useMemo(
    () => corridors.filter(corridor => {
      if (activeLevel === 'all') return true
      const source = zoneLookup[corridor.source]
      const target = zoneLookup[corridor.target]
      return [source?.level, target?.level].includes(activeLevel)
    }),
    [corridors, activeLevel, zoneLookup],
  )
  const visibleAmenities = useMemo(
    () => amenities.filter(feature => activeLevel === 'all' || feature.level === activeLevel || feature.level === 'all'),
    [amenities, activeLevel],
  )
  const visibleCirculation = useMemo(
    () => circulation.filter(feature => activeLevel === 'all' || feature.level === activeLevel || feature.level === 'all'),
    [circulation, activeLevel],
  )
  const visibleSensors = useMemo(
    () => sensors.filter(sensor => {
      const zone = zoneLookup[sensor.zoneId]
      return activeLevel === 'all' || zone?.level === activeLevel || zone?.level === 'all'
    }),
    [sensors, activeLevel, zoneLookup],
  )
  const selectedZone = visibleZones.find(zone => zone.id === selectedZoneId)
    || [...visibleZones].sort((a, b) => (b.predictedDensity || 0) - (a.predictedDensity || 0))[0]
    || null
  const hoveredSensor = visibleSensors.find(sensor => sensor.id === hoveredSensorId) || null

  return (
    <div style={styles.wrap} className="card widget-float">
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Venue Floorplan</div>
          <div style={styles.title}>Live arena intelligence across the operating layout</div>
        </div>
        <div style={styles.headerMetrics}>
          <StatPill icon={<Radar size={12} />} label={`${zones.length} zones`} />
          <StatPill icon={<Waves size={12} />} label={`${corridors.length} corridors`} />
          <StatPill icon={<Camera size={12} />} label={`${sensors.length} sensors`} />
        </div>
      </div>

      <div style={styles.levelTabs}>
        {[
          { id: 'all', label: 'Full Venue' },
          { id: 'bowl', label: 'Seating Bowl' },
          { id: 'concourse', label: 'Concourses' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveLevel(tab.id)}
            style={activeLevel === tab.id ? styles.levelTabActive : styles.levelTab}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content} className="venue-map-layout">
        <div style={styles.mapPanel}>
          <svg viewBox="0 0 1000 700" style={styles.svg} className="venue-map-svg" aria-label="Venue floorplan">
            <defs>
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <filter key={status} id={`zone-glow-${status}`} x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor={color} floodOpacity="0.42" />
                </filter>
              ))}
              <linearGradient id="fieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(17, 31, 28, 0.92)" />
                <stop offset="100%" stopColor="rgba(8, 15, 18, 0.86)" />
              </linearGradient>
              <pattern id="seatPattern" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="4" r="1.5" fill="rgba(255, 232, 193, 0.22)" />
                <circle cx="11" cy="10" r="1.2" fill="rgba(255, 232, 193, 0.14)" />
              </pattern>
              <marker id="flowArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6 Z" fill="rgba(245, 223, 173, 0.8)" />
              </marker>
            </defs>

            <rect x="24" y="24" width="952" height="652" rx="34" fill="rgba(9, 9, 8, 0.92)" stroke="rgba(246, 222, 170, 0.12)" />
            <ellipse cx="500" cy="350" rx="298" ry="212" fill="rgba(18, 18, 16, 0.94)" stroke="rgba(241, 205, 122, 0.18)" strokeWidth="2" />
            <ellipse cx="500" cy="350" rx="228" ry="158" fill="url(#seatPattern)" opacity="0.5" />
            <ellipse cx="500" cy="350" rx="134" ry="92" fill="url(#fieldGradient)" stroke="rgba(96, 156, 138, 0.45)" strokeWidth="2" />
            <path d="M500 258 L500 442" stroke="rgba(132, 202, 178, 0.24)" strokeWidth="2" />
            <path d="M366 350 L634 350" stroke="rgba(132, 202, 178, 0.2)" strokeWidth="2" />
            <ellipse cx="500" cy="350" rx="174" ry="126" fill="none" stroke="rgba(241, 205, 122, 0.12)" strokeDasharray="7 10" />
            <path d="M212 138 L788 138" stroke="rgba(241, 205, 122, 0.08)" strokeWidth="16" strokeLinecap="round" />
            <path d="M212 562 L788 562" stroke="rgba(241, 205, 122, 0.08)" strokeWidth="16" strokeLinecap="round" />
            <path d="M174 220 L174 480" stroke="rgba(241, 205, 122, 0.08)" strokeWidth="16" strokeLinecap="round" />
            <path d="M826 220 L826 480" stroke="rgba(241, 205, 122, 0.08)" strokeWidth="16" strokeLinecap="round" />
            <text x="500" y="110" textAnchor="middle" style={styles.tierLabel}>UPPER BOWL</text>
            <text x="500" y="604" textAnchor="middle" style={styles.tierLabel}>LOWER BOWL</text>
            <text x="120" y="350" textAnchor="middle" transform="rotate(-90 120 350)" style={styles.sideLabel}>WEST STAND</text>
            <text x="880" y="350" textAnchor="middle" transform="rotate(90 880 350)" style={styles.sideLabel}>EAST STAND</text>

            {visibleAmenities.map(feature => (
              <g key={feature.id}>
                <polygon
                  points={feature.polygon}
                  fill={amenityFill(feature.type)}
                  stroke="rgba(255, 240, 207, 0.18)"
                  strokeWidth="1"
                  opacity="0.9"
                />
                <text x={feature.center.x} y={feature.center.y + 4} textAnchor="middle" style={styles.amenityLabel}>
                  {feature.label}
                </text>
              </g>
            ))}

            {visibleCorridors.map(corridor => (
              <g key={corridor.id}>
                <path
                  d={corridor.path}
                  fill="none"
                  stroke={corridor.saturated ? 'rgba(239, 68, 68, 0.24)' : 'rgba(241, 205, 122, 0.08)'}
                  strokeWidth={10 + corridor.utilization * 22}
                  strokeLinecap="round"
                />
                <path
                  d={corridor.path}
                  fill="none"
                  stroke={corridor.saturated ? 'rgba(239, 68, 68, 0.9)' : 'rgba(247, 224, 163, 0.7)'}
                  strokeWidth={1.4 + corridor.utilization * 5}
                  strokeLinecap="round"
                  strokeDasharray="12 18"
                  markerEnd="url(#flowArrow)"
                  style={{ animation: 'venueFlow 1.4s linear infinite' }}
                />
              </g>
            ))}

            {visibleZones.map(zone => {
              const predictedHigher = zone.predictedDensity > zone.density + 0.05
              const selected = zone.id === selectedZone?.id
              return (
                <g key={zone.id} onClick={() => setSelectedZoneId(zone.id)} style={{ cursor: 'pointer' }}>
                  <polygon
                    points={zone.polygon}
                    fill={fillForDensity(zone.density)}
                    stroke={selected ? '#f8df9e' : zone.isVirtual ? 'rgba(255, 240, 207, 0.34)' : 'rgba(255, 240, 207, 0.22)'}
                    strokeWidth={selected ? 2.6 : zone.isVirtual ? 1 : 1.2}
                    filter={zone.edgeGlow ? `url(#zone-glow-${zone.status})` : 'none'}
                    opacity={zone.isVirtual ? 0.92 : 0.74}
                  />
                  {predictedHigher && (
                    <polygon
                      points={zone.polygon}
                      fill="none"
                      stroke="rgba(245, 210, 118, 0.92)"
                      strokeWidth="2"
                      strokeDasharray="9 7"
                      style={{ animation: 'predictionPulse 2.4s ease-in-out infinite' }}
                    />
                  )}
                  <text
                    x={zone.center.x}
                    y={zone.center.y - (zone.isVirtual ? 4 : 8)}
                    textAnchor="middle"
                    style={zone.isVirtual ? styles.microZoneLabel : styles.zoneLabel}
                  >
                    {zone.shortLabel || zone.label}
                  </text>
                  <text
                    x={zone.center.x}
                    y={zone.center.y + (zone.isVirtual ? 10 : 14)}
                    textAnchor="middle"
                    style={zone.isVirtual ? styles.microZoneValue : styles.zoneValue}
                  >
                    {Math.round(zone.density * 100)}%
                  </text>
                </g>
              )
            })}

            {visibleCirculation.map(feature => (
              <g key={feature.id} transform={`translate(${feature.x}, ${feature.y})`}>
                {feature.type === 'stair' && (
                  <>
                    <rect x="-12" y="-12" width="24" height="24" rx="6" fill="rgba(13, 16, 22, 0.9)" stroke="rgba(245, 223, 173, 0.45)" />
                    <path d="M-6 6 L-1 6 L-1 1 L4 1 L4 -4 L9 -4" fill="none" stroke="rgba(245, 223, 173, 0.8)" strokeWidth="2" />
                  </>
                )}
                {feature.type === 'vomitory' && (
                  <>
                    <circle r="9" fill="rgba(27, 19, 10, 0.94)" stroke="rgba(245, 223, 173, 0.34)" />
                    <path d="M-4 -2 L0 -6 L4 -2 M-4 2 L0 6 L4 2" fill="none" stroke="rgba(245, 223, 173, 0.78)" strokeWidth="1.5" />
                  </>
                )}
              </g>
            ))}

            {visibleSensors.map(sensor => {
              const active = sensor.id === hoveredSensorId
              return (
                <g
                  key={sensor.id}
                  transform={`translate(${sensor.x}, ${sensor.y})`}
                  onMouseEnter={() => setHoveredSensorId(sensor.id)}
                  onMouseLeave={() => setHoveredSensorId(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="8.5" fill="rgba(10, 10, 9, 0.94)" stroke={active ? '#f8df9e' : 'rgba(245, 223, 173, 0.52)'} strokeWidth="1.5" />
                  <circle r="2.3" fill="rgba(245, 223, 173, 0.9)" style={{ animation: 'sensorPulse 2s ease-in-out infinite' }} />
                  {sensor.type === 'camera' && <path d="M-3 -2 L0 -5 L3 -2 L3 3 L-3 3 Z" fill="rgba(245, 223, 173, 0.85)" />}
                  {sensor.type !== 'camera' && <circle r="4.5" fill="none" stroke="rgba(245, 223, 173, 0.7)" strokeWidth="1" />}
                </g>
              )
            })}

            {hoveredSensor && (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={hoveredSensor.x + 16} y={hoveredSensor.y - 30} width="190" height="44" rx="10" fill="rgba(6, 6, 6, 0.94)" stroke="rgba(245, 223, 173, 0.28)" />
                <text x={hoveredSensor.x + 28} y={hoveredSensor.y - 12} style={styles.sensorTooltipTitle}>
                  {hoveredSensor.title}
                </text>
                <text x={hoveredSensor.x + 28} y={hoveredSensor.y + 6} style={styles.sensorTooltipText}>
                  {`${hoveredSensor.label} -> ${hoveredSensor.zoneName} -> density ${hoveredSensor.reading}%`}
                </text>
              </g>
            )}
          </svg>

          <div style={styles.legend}>
            <LegendSwatch color="rgba(16, 185, 129, 0.7)" label="Low occupancy" />
            <LegendSwatch color="rgba(245, 158, 11, 0.72)" label="Building pressure" />
            <LegendSwatch color="rgba(239, 68, 68, 0.76)" label="Risk zone" />
            <LegendSwatch dashed label="3-5 min forecast" />
            <LegendSwatch line label="Corridor flow" />
            <LegendSwatch icon={<Building2 size={12} />} label="Suites / clubs" />
            <LegendSwatch icon={<ShoppingBag size={12} />} label="Merch / amenities" />
            <LegendSwatch icon={<HeartPulse size={12} />} label="First aid" />
            <LegendSwatch icon={<GitBranchPlus size={12} />} label="Stairs / vomitories" />
          </div>
        </div>

        <div style={styles.sidebar}>
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarEyebrow}>Selected Zone</div>
            <div style={styles.sidebarTitle}>{selectedZone?.label || 'No zone selected'}</div>
            <div style={styles.statusRow}>
              <span style={{ ...styles.statusBadge, color: selectedZone?.color || '#f1cb7b', borderColor: `${selectedZone?.color || '#f1cb7b'}55` }}>
                {selectedZone?.riskLevel || 'Observed'}
              </span>
              <span style={styles.statusMeta}>{selectedZone?.trendLabel || 'Stable'} flow</span>
            </div>
            <MetricRow label="Current density" value={percent(selectedZone?.density)} />
            <MetricRow label="Projected in 5 min" value={percent(selectedZone?.predictedDensity)} />
            <MetricRow label="Confidence" value={percent(selectedZone?.confidence)} />
            <MetricRow label="Dominant inflow" value={selectedZone?.dominantInflowSource || 'Mixed venue traffic'} />
            <MetricRow label="Operational level" value={selectedZone?.level === 'bowl' ? 'Seating bowl' : selectedZone?.level === 'concourse' ? 'Concourse layer' : 'Cross-venue'} />
            <div style={styles.recommendation}>
              <div style={styles.recommendationLabel}>Recommended action</div>
              <div style={styles.recommendationText}>{selectedZone?.recommendedAction || 'Monitor adjacent corridors and keep operator review active.'}</div>
            </div>
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sidebarEyebrow}>Sensor Trace</div>
            {visibleSensors.slice(0, 5).map(sensor => (
              <div key={sensor.id} style={styles.sensorRow}>
                <div>
                  <div style={styles.sensorName}>{sensor.label}</div>
                  <div style={styles.sensorZone}>{sensor.zoneName}</div>
                </div>
                <div style={styles.sensorReading}>{sensor.reading}%</div>
              </div>
            ))}
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sidebarEyebrow}>Venue Layers</div>
            <div style={styles.noteRow}>
              <Activity size={14} color="var(--accent-primary)" />
              <span style={styles.noteText}>Solid fills show current occupancy by zone, not abstract node pressure.</span>
            </div>
            <div style={styles.noteRow}>
              <ChevronRight size={14} color="var(--accent-primary)" />
              <span style={styles.noteText}>Animated corridor pulses now follow actual walkways between gates, concourses, sections, and exits.</span>
            </div>
            <div style={styles.noteRow}>
              <Landmark size={14} color="var(--accent-primary)" />
              <span style={styles.noteText}>Level toggles let operators isolate the seating bowl or concourse layer without losing the live density story.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LegendSwatch({ color, label, dashed = false, line = false, icon = null }) {
  return (
    <div style={styles.legendItem}>
      <div
        style={{
          ...styles.legendSwatch,
          background: line ? 'transparent' : color || 'transparent',
          border: dashed ? '2px dashed rgba(245, 210, 118, 0.92)' : line ? 'none' : '1px solid rgba(255,255,255,0.14)',
        }}
      >
        {line && <div style={styles.legendLine} />}
        {icon && !line && !dashed && <span style={styles.legendIcon}>{icon}</span>}
      </div>
      <span style={styles.legendLabel}>{label}</span>
    </div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div style={styles.metricRow}>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricValue}>{value}</span>
    </div>
  )
}

function StatPill({ icon, label }) {
  return (
    <div style={styles.statPill}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

function percent(value) {
  if (typeof value !== 'number') return '—'
  return `${Math.round(value * 100)}%`
}

function fillForDensity(density = 0) {
  if (density >= 0.8) return 'rgba(239, 68, 68, 0.58)'
  if (density >= 0.5) return 'rgba(245, 158, 11, 0.5)'
  return 'rgba(16, 185, 129, 0.4)'
}

function amenityFill(type) {
  if (type === 'suite') return 'rgba(117, 154, 255, 0.22)'
  if (type === 'club') return 'rgba(196, 149, 60, 0.25)'
  if (type === 'merch') return 'rgba(138, 190, 133, 0.25)'
  if (type === 'restroom') return 'rgba(99, 176, 220, 0.22)'
  if (type === 'medical') return 'rgba(239, 103, 103, 0.24)'
  return 'rgba(245, 223, 173, 0.16)'
}

if (typeof document !== 'undefined' && !document.getElementById('venue-floorplan-style')) {
  const style = document.createElement('style')
  style.id = 'venue-floorplan-style'
  style.innerHTML = `
    @keyframes venueFlow { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }
    @keyframes predictionPulse { 0%,100% { stroke-opacity: 0.35; } 50% { stroke-opacity: 1; } }
    @keyframes sensorPulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.25); } }
    @media (max-width: 1180px) {
      .venue-map-layout { grid-template-columns: 1fr !important; }
      .venue-map-svg { min-height: 640px !important; }
    }
    @media (max-width: 760px) {
      .venue-map-svg { min-height: 520px !important; }
    }
  `
  document.head.appendChild(style)
}

const styles = {
  wrap: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  eyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: 'var(--text-muted)',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    color: 'var(--text-primary)',
  },
  headerMetrics: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  levelTabs: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  levelTab: {
    border: '1px solid rgba(241, 205, 122, 0.18)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-secondary)',
    borderRadius: '999px',
    padding: '9px 14px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
  },
  levelTabActive: {
    border: '1px solid rgba(241, 205, 122, 0.34)',
    background: 'rgba(241, 205, 122, 0.12)',
    color: 'var(--text-primary)',
    borderRadius: '999px',
    padding: '9px 14px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    boxShadow: '0 0 22px rgba(241, 205, 122, 0.08)',
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '999px',
    background: 'rgba(255, 247, 229, 0.05)',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    color: 'var(--text-secondary)',
    fontSize: 11,
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2.5fr) minmax(300px, 0.9fr)',
    gap: '18px',
  },
  mapPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  svg: {
    width: '100%',
    height: 'auto',
    borderRadius: '22px',
    background: 'radial-gradient(circle at 50% 30%, rgba(245, 215, 150, 0.06) 0%, rgba(8, 8, 8, 0.12) 52%, rgba(4, 4, 4, 0.42) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    minHeight: '760px',
  },
  zoneLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    fontWeight: 700,
    fill: '#f8e5bb',
    pointerEvents: 'none',
  },
  zoneValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 14,
    fontWeight: 600,
    fill: 'rgba(255, 244, 220, 0.86)',
    pointerEvents: 'none',
  },
  microZoneLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 10,
    fontWeight: 700,
    fill: 'rgba(250, 236, 200, 0.95)',
    letterSpacing: '0.04em',
    pointerEvents: 'none',
  },
  microZoneValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    fill: 'rgba(255, 244, 220, 0.78)',
    pointerEvents: 'none',
  },
  tierLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    letterSpacing: '0.18em',
    fill: 'rgba(245, 223, 173, 0.5)',
  },
  sideLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 12,
    letterSpacing: '0.18em',
    fill: 'rgba(245, 223, 173, 0.4)',
  },
  sensorTooltipTitle: {
    fill: '#f8df9e',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
  },
  sensorTooltipText: {
    fill: 'rgba(255, 239, 208, 0.82)',
    fontSize: 10,
    fontFamily: 'var(--font-body)',
  },
  amenityLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 8,
    fontWeight: 700,
    fill: 'rgba(255, 241, 214, 0.7)',
    letterSpacing: '0.06em',
    pointerEvents: 'none',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    fontSize: 11,
  },
  legendSwatch: {
    width: 24,
    height: 12,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(245, 223, 173, 0.84)',
  },
  legendLine: {
    width: 20,
    height: 0,
    borderTop: '2px solid rgba(245, 223, 173, 0.8)',
  },
  legendLabel: {
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: 10,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sidebarCard: {
    background: 'rgba(13, 10, 8, 0.72)',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    borderRadius: '18px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sidebarEyebrow: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: 'var(--text-muted)',
  },
  sidebarTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 18,
    color: 'var(--text-primary)',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontWeight: 700,
  },
  statusMeta: {
    color: 'var(--text-secondary)',
    fontSize: 12,
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  metricLabel: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  metricValue: {
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'right',
  },
  recommendation: {
    padding: '12px',
    borderRadius: '14px',
    background: 'rgba(255, 244, 220, 0.04)',
    border: '1px solid rgba(241, 205, 122, 0.12)',
  },
  recommendationLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--text-muted)',
    marginBottom: '6px',
  },
  recommendationText: {
    color: 'var(--text-secondary)',
    fontSize: 12,
  },
  sensorRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
  },
  sensorName: {
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: 12,
  },
  sensorZone: {
    color: 'var(--text-muted)',
    fontSize: 11,
  },
  sensorReading: {
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  },
  noteRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  noteText: {
    color: 'var(--text-secondary)',
    fontSize: 12,
  },
}
