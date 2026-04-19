import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Building2,
  Camera,
  ChevronRight,
  GitBranchPlus,
  HeartPulse,
  Landmark,
  Minus,
  Move,
  Plus,
  Radar,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Waves,
  X,
  Search,
} from 'lucide-react'
import { buildVenueFloorplan } from '../utils/venueFloorplan'

const STATUS_COLORS = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
}

const PHASE_PRESETS = {
  ingress: {
    label: 'Ingress',
    subtitle: 'Arrival-heavy circulation with gate inflow and bowl loading.',
    corridorMultiplier: 1.15,
    corridorBias: 0.08,
    dashSpeed: 1.2,
    emphasis: ['gate', 'concourse'],
    badge: 'Pre-event arrivals',
  },
  halftime: {
    label: 'Halftime',
    subtitle: 'Concourse pressure and concession clustering during intermission.',
    corridorMultiplier: 1.35,
    corridorBias: 0.14,
    dashSpeed: 0.95,
    emphasis: ['concourse', 'concession'],
    badge: 'Intermission rush',
  },
  egress: {
    label: 'Egress',
    subtitle: 'Exit-first routing with bowl release and perimeter clearing.',
    corridorMultiplier: 1.25,
    corridorBias: 0.12,
    dashSpeed: 1.55,
    emphasis: ['section', 'exit'],
    badge: 'Post-event release',
  },
}

const MIN_SCALE = 1
const MAX_SCALE = 2.8

export default function VenueMap({ nodes = [], edges = [] }) {
  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [hoveredSensorId, setHoveredSensorId] = useState(null)
  const [hoveredZoneId, setHoveredZoneId] = useState(null)
  const [activeLevel, setActiveLevel] = useState('all')
  const [activePhase, setActivePhase] = useState('ingress')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)
  const stageRef = useRef(null)

  const { zones, corridors, sensors, amenities, circulation } = useMemo(() => buildVenueFloorplan(nodes, edges), [nodes, edges])
  const zoneLookup = useMemo(() => Object.fromEntries(zones.map(zone => [zone.id, zone])), [zones])
  const phasePreset = PHASE_PRESETS[activePhase]

  const visibleZones = useMemo(
    () => zones.filter(zone => activeLevel === 'all' || zone.level === activeLevel || zone.level === 'all'),
    [zones, activeLevel],
  )

  const visibleCorridors = useMemo(
    () => corridors
      .filter(corridor => {
        if (activeLevel === 'all') return true
        const source = zoneLookup[corridor.source]
        const target = zoneLookup[corridor.target]
        return [source?.level, target?.level].includes(activeLevel)
      })
      .map(corridor => {
        const source = zoneLookup[corridor.source]
        const target = zoneLookup[corridor.target]
        const sourceType = source?.zoneType
        const targetType = target?.zoneType
        const emphasisHit = phasePreset.emphasis.includes(sourceType) || phasePreset.emphasis.includes(targetType)
        const utilization = clamp((corridor.utilization * phasePreset.corridorMultiplier) + (emphasisHit ? phasePreset.corridorBias : 0), 0.08, 1)
        return {
          ...corridor,
          utilization,
          saturated: corridor.saturated || utilization > 0.84,
          dashDuration: `${phasePreset.dashSpeed + (1 - utilization) * 0.9}s`,
          flowMode: phasePreset.label,
        }
      }),
    [corridors, activeLevel, zoneLookup, phasePreset],
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
  const featuredSensors = visibleSensors
    .filter(sensor => sensor.zoneId === selectedZone?.id || sensor.zoneId === selectedZone?.parentId)
    .slice(0, 3)
  const inspectorPosition = selectedZone ? getInspectorPosition(selectedZone.center) : null
  const minimapViewport = getMinimapViewport(viewport)
  const searchableItems = useMemo(() => {
    const zoneItems = zones
      .filter(zone => !zone.isVirtual)
      .map(zone => ({
        id: zone.id,
        label: zone.label,
        shortLabel: zone.shortLabel,
        kind: zone.zoneType || 'zone',
        target: zone,
      }))
    const amenityItems = amenities.map(feature => ({
      id: feature.id,
      label: feature.label,
      shortLabel: feature.shortLabel || feature.label,
      kind: feature.type,
      target: feature,
      isAmenity: true,
    }))
    return [...zoneItems, ...amenityItems]
  }, [zones, amenities])
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return searchableItems.slice(0, 6)
    return searchableItems
      .filter(item =>
        item.label.toLowerCase().includes(query)
        || item.shortLabel?.toLowerCase().includes(query)
        || item.id.toLowerCase().includes(query),
      )
      .slice(0, 8)
  }, [searchQuery, searchableItems])
  const breadcrumbs = useMemo(() => {
    if (!selectedZone) return ['Venue', PHASE_PRESETS[activePhase].label, activeLevel === 'all' ? 'All Layers' : activeLevel === 'bowl' ? 'Seating Bowl' : 'Concourse']
    const levelLabel = selectedZone.level === 'bowl' ? 'Seating Bowl' : selectedZone.level === 'concourse' ? 'Concourse' : 'Venue'
    return ['Venue', levelLabel, selectedZone.shortLabel || selectedZone.label, selectedZone.label]
  }, [selectedZone, activeLevel, activePhase])

  useEffect(() => {
    setViewport(prev => ({ ...prev, scale: 1, x: 0, y: 0 }))
  }, [activeLevel])

  useEffect(() => {
    if (!selectedZone) return
    setViewport(getViewportForZone(selectedZone))
  }, [selectedZoneId])

  const handleWheel = (event) => {
    event.preventDefault()
    const nextScale = clamp(viewport.scale + (event.deltaY > 0 ? -0.14 : 0.14), MIN_SCALE, MAX_SCALE)
    setViewport(prev => ({ ...prev, scale: nextScale }))
  }

  const handlePointerDown = (event) => {
    if (event.target.closest?.('[data-overlay-ui="true"]')) return
    dragRef.current = { x: event.clientX, y: event.clientY, startX: viewport.x, startY: viewport.y }
    setDragging(true)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current) return
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    setViewport(prev => ({
      ...prev,
      x: dragRef.current.startX + dx,
      y: dragRef.current.startY + dy,
    }))
  }

  const stopDragging = () => {
    dragRef.current = null
    setDragging(false)
  }

  const handleMinimapJump = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 1000
    const y = ((event.clientY - bounds.top) / bounds.height) * 700
    setViewport(centerViewportOnPoint(x, y, Math.max(viewport.scale, 1.45)))
  }

  const jumpToItem = (item) => {
    if (item.isAmenity) {
      setViewport(centerViewportOnPoint(item.target.center.x, item.target.center.y, 1.85))
      setSearchQuery('')
      return
    }
    setSelectedZoneId(item.id)
    setViewport(getViewportForZone(item.target))
    setSearchQuery('')
  }

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

      <div style={styles.toolbarRow}>
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

        <div style={styles.phaseTabs}>
          {Object.entries(PHASE_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActivePhase(key)}
              style={activePhase === key ? styles.phaseTabActive : styles.phaseTab}
            >
              <span style={styles.phaseTabLabel}>{preset.label}</span>
              <span style={styles.phaseTabMeta}>{preset.badge}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.mapStage} ref={stageRef}>
        <div style={styles.mapHud} data-overlay-ui="true">
          <div style={styles.hudEyebrow}>Arena Operations View</div>
          <div style={styles.hudTitle}>{phasePreset.label} preset</div>
          <div style={styles.hudSubtle}>{phasePreset.subtitle}</div>
        </div>

        <div style={styles.searchLayer} data-overlay-ui="true">
          <div style={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`} style={styles.breadcrumbItem}>
                {index > 0 && <span style={styles.breadcrumbDivider}>/</span>}
                <span>{crumb}</span>
              </span>
            ))}
          </div>

          <div style={styles.searchBox}>
            <Search size={14} color="var(--text-muted)" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Jump to 101A, East Club Walk, Gate C..."
              style={styles.searchInput}
            />
          </div>

          {(searchQuery.trim() || searchResults.length > 0) && (
            <div style={styles.searchResults}>
              {searchResults.map(item => (
                <button
                  key={item.id}
                  type="button"
                  style={styles.searchResultButton}
                  onClick={() => jumpToItem(item)}
                >
                  <span style={styles.searchResultMain}>{item.shortLabel || item.label}</span>
                  <span style={styles.searchResultMeta}>{item.label} · {item.kind}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={styles.zoomControls} data-overlay-ui="true">
          <button type="button" style={styles.iconButton} onClick={() => setViewport(prev => ({ ...prev, scale: clamp(prev.scale + 0.2, MIN_SCALE, MAX_SCALE) }))}>
            <Plus size={14} />
          </button>
          <button type="button" style={styles.iconButton} onClick={() => setViewport(prev => ({ ...prev, scale: clamp(prev.scale - 0.2, MIN_SCALE, MAX_SCALE) }))}>
            <Minus size={14} />
          </button>
          <button type="button" style={styles.iconButton} onClick={() => setViewport({ scale: 1, x: 0, y: 0 })}>
            <Move size={14} />
          </button>
          <div style={styles.zoomReadout}>{Math.round(viewport.scale * 100)}%</div>
        </div>

        <div style={styles.minimapCard} data-overlay-ui="true">
          <div style={styles.minimapHeader}>
            <span style={styles.minimapTitle}>Minimap</span>
            <span style={styles.minimapHint}>Click to jump</span>
          </div>
          <svg
            viewBox="0 0 1000 700"
            style={styles.minimapSvg}
            onClick={handleMinimapJump}
          >
            <rect x="24" y="24" width="952" height="652" rx="34" fill="rgba(9, 9, 8, 0.84)" stroke="rgba(246, 222, 170, 0.08)" />
            <ellipse cx="500" cy="350" rx="298" ry="212" fill="rgba(18, 18, 16, 0.84)" stroke="rgba(241, 205, 122, 0.12)" strokeWidth="2" />
            {visibleZones.map(zone => (
              <polygon
                key={zone.id}
                points={zone.polygon}
                fill={fillForDensity(zone.density)}
                opacity={zone.id === selectedZone?.id ? 0.95 : 0.5}
                stroke={zone.id === selectedZone?.id ? 'rgba(255, 244, 220, 0.82)' : 'none'}
                strokeWidth={zone.id === selectedZone?.id ? 4 : 0}
              />
            ))}
            <rect
              x={minimapViewport.x}
              y={minimapViewport.y}
              width={minimapViewport.width}
              height={minimapViewport.height}
              rx="14"
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(245, 223, 173, 0.72)"
              strokeWidth="8"
            />
          </svg>
          <div style={styles.snapList}>
            {visibleZones
              .filter(zone => !zone.isVirtual)
              .sort((a, b) => (b.predictedDensity || 0) - (a.predictedDensity || 0))
              .slice(0, 4)
              .map(zone => (
                <button
                  key={zone.id}
                  type="button"
                  style={zone.id === selectedZone?.id ? styles.snapButtonActive : styles.snapButton}
                  onClick={() => {
                    setSelectedZoneId(zone.id)
                    setViewport(getViewportForZone(zone))
                  }}
                >
                  <span>{zone.shortLabel || zone.label}</span>
                  <span style={styles.snapDensity}>{Math.round(zone.density * 100)}%</span>
                </button>
              ))}
          </div>
        </div>

        <div
          style={{ ...styles.svgShell, cursor: dragging ? 'grabbing' : viewport.scale > 1 ? 'grab' : 'default' }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerLeave={stopDragging}
        >
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

            <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`}>
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
                  {feature.labelPos && (
                    <g>
                      <path
                        d={`M ${feature.center.x} ${feature.center.y} L ${feature.labelPos.x} ${feature.labelPos.y - 10}`}
                        stroke="rgba(255, 235, 194, 0.2)"
                        strokeWidth="1"
                      />
                      <rect
                        x={feature.labelPos.x - 34}
                        y={feature.labelPos.y - 20}
                        width="68"
                        height="18"
                        rx="9"
                        fill="rgba(10, 10, 9, 0.84)"
                        stroke="rgba(241, 205, 122, 0.14)"
                      />
                      <text x={feature.labelPos.x} y={feature.labelPos.y - 7} textAnchor="middle" style={styles.amenityChipLabel}>
                        {feature.shortLabel || feature.label}
                      </text>
                    </g>
                  )}
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
                    stroke={corridor.saturated ? 'rgba(239, 68, 68, 0.9)' : corridor.flowMode === 'Halftime' ? 'rgba(255, 196, 87, 0.8)' : corridor.flowMode === 'Egress' ? 'rgba(255, 235, 194, 0.78)' : 'rgba(247, 224, 163, 0.7)'}
                    strokeWidth={1.4 + corridor.utilization * 5}
                    strokeLinecap="round"
                    strokeDasharray={corridor.flowMode === 'Halftime' ? '8 12' : corridor.flowMode === 'Egress' ? '18 14' : '12 18'}
                    markerEnd="url(#flowArrow)"
                    style={{ animation: `venueFlow ${corridor.dashDuration} linear infinite` }}
                  />
                </g>
              ))}

              {visibleZones.map(zone => {
                const predictedHigher = zone.predictedDensity > zone.density + 0.05
                const selected = zone.id === selectedZone?.id
                const hovered = zone.id === hoveredZoneId
                return (
                  <g
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    onMouseEnter={() => setHoveredZoneId(zone.id)}
                    onMouseLeave={() => setHoveredZoneId(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <polygon
                      points={zone.polygon}
                      fill={fillForDensity(zone.density)}
                      stroke={selected ? '#f8df9e' : hovered ? 'rgba(255, 245, 217, 0.8)' : zone.isVirtual ? 'rgba(255, 240, 207, 0.34)' : 'rgba(255, 240, 207, 0.18)'}
                      strokeWidth={selected ? 2.6 : hovered ? 1.8 : zone.isVirtual ? 0.9 : 1.1}
                      filter={zone.edgeGlow ? `url(#zone-glow-${zone.status})` : 'none'}
                      opacity={zone.isVirtual ? 0.92 : 0.68}
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
                    {(selected || hovered || zone.isVirtual) && (
                      <text
                        x={zone.center.x}
                        y={zone.center.y - (zone.isVirtual ? 4 : 8)}
                        textAnchor="middle"
                        style={zone.isVirtual ? styles.microZoneLabel : styles.zoneLabel}
                      >
                        {zone.shortLabel || zone.label}
                      </text>
                    )}
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
            </g>
          </svg>
        </div>

        {selectedZone && inspectorPosition && (
          <div
            style={{
              ...styles.floatingInspector,
              left: inspectorPosition.left,
              top: inspectorPosition.top,
            }}
            data-overlay-ui="true"
          >
            <div style={styles.inspectorHeader}>
              <div>
                <div style={styles.sidebarEyebrow}>Selected Zone</div>
                <div style={styles.sidebarTitle}>{selectedZone.label}</div>
              </div>
              <button type="button" style={styles.closeButton} onClick={() => setSelectedZoneId(null)}>
                <X size={14} />
              </button>
            </div>

            <div style={styles.drawerKicker}>
              <Sparkles size={13} color="var(--accent-primary)" />
              <span>{selectedZone.shortLabel || 'Operational view'}</span>
            </div>

            <div style={styles.statusRow}>
              <span style={{ ...styles.statusBadge, color: selectedZone.color || '#f1cb7b', borderColor: `${selectedZone.color || '#f1cb7b'}55` }}>
                {selectedZone.riskLevel || 'Observed'}
              </span>
              <span style={styles.statusMeta}>{selectedZone.trendLabel || 'Stable'} flow</span>
            </div>

            <MetricRow label="Current density" value={percent(selectedZone.density)} />
            <MetricRow label="Projected in 5 min" value={percent(selectedZone.predictedDensity)} />
            <MetricRow label="Confidence" value={percent(selectedZone.confidence)} />
            <MetricRow label="Dominant inflow" value={selectedZone.dominantInflowSource || 'Mixed venue traffic'} />
            <MetricRow label="Operational level" value={selectedZone.level === 'bowl' ? 'Seating bowl' : selectedZone.level === 'concourse' ? 'Concourse layer' : 'Cross-venue'} />

            <div style={styles.recommendation}>
              <div style={styles.recommendationLabel}>Recommended action</div>
              <div style={styles.recommendationText}>{selectedZone.recommendedAction || 'Monitor adjacent corridors and keep operator review active.'}</div>
            </div>

            <button
              type="button"
              style={styles.snapInspectorButton}
              onClick={() => setViewport(getViewportForZone(selectedZone))}
            >
              Snap Camera To Zone
            </button>

            <div style={styles.sidebarEyebrow}>Camera / Sensor Cards</div>
            {featuredSensors.length ? featuredSensors.map(sensor => (
              <div key={sensor.id} style={styles.feedCard}>
                <div style={styles.feedCardTop}>
                  <span style={styles.feedPill}>{sensor.label}</span>
                  <span style={styles.feedStatus}>{sensor.reading}% load</span>
                </div>
                <div style={styles.feedTitle}>{sensor.title}</div>
                <div style={styles.feedMeta}>{sensor.zoneName}</div>
              </div>
            )) : (
              <div style={styles.emptyFeed}>No direct camera cards mapped to this zone yet.</div>
            )}
          </div>
        )}
      </div>

      <div style={styles.bottomStrip}>
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

        <div style={styles.notesPanel}>
          <div style={styles.noteRow}>
            <Activity size={14} color="var(--accent-primary)" />
            <span style={styles.noteText}>Use scroll to zoom and drag to pan for section-level inspection.</span>
          </div>
          <div style={styles.noteRow}>
            <ChevronRight size={14} color="var(--accent-primary)" />
            <span style={styles.noteText}>Phase presets adjust corridor behavior for ingress, halftime, and egress narratives.</span>
          </div>
          <div style={styles.noteRow}>
            <Landmark size={14} color="var(--accent-primary)" />
            <span style={styles.noteText}>Short labels stay on-map while the floating inspector holds detailed operational context.</span>
          </div>
          <div style={styles.noteRow}>
            <ShieldAlert size={14} color="var(--accent-primary)" />
            <span style={styles.noteText}>Select any zone to open a movable-style inspector anchored near the area of interest.</span>
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function getInspectorPosition(center) {
  const left = clamp(center.x + 36, 32, 690)
  const top = clamp(center.y - 120, 32, 418)
  return { left, top }
}

function centerViewportOnPoint(x, y, scale) {
  const centeredX = 500 - (x * scale)
  const centeredY = 350 - (y * scale)
  return {
    scale,
    x: clamp(centeredX, -1800, 1800),
    y: clamp(centeredY, -1400, 1400),
  }
}

function getViewportForZone(zone) {
  const scale = zone.isVirtual ? 2.15 : zone.zoneType === 'section' ? 1.9 : zone.zoneType === 'concourse' ? 1.65 : 1.5
  return centerViewportOnPoint(zone.center.x, zone.center.y, scale)
}

function getMinimapViewport(viewport) {
  const visibleWidth = 1000 / viewport.scale
  const visibleHeight = 700 / viewport.scale
  const x = clamp((-viewport.x / viewport.scale), 0, 1000 - visibleWidth)
  const y = clamp((-viewport.y / viewport.scale), 0, 700 - visibleHeight)
  return {
    x,
    y,
    width: visibleWidth,
    height: visibleHeight,
  }
}

if (typeof document !== 'undefined' && !document.getElementById('venue-floorplan-style')) {
  const style = document.createElement('style')
  style.id = 'venue-floorplan-style'
  style.innerHTML = `
    @keyframes venueFlow { from { stroke-dashoffset: 60; } to { stroke-dashoffset: 0; } }
    @keyframes predictionPulse { 0%,100% { stroke-opacity: 0.35; } 50% { stroke-opacity: 1; } }
    @keyframes sensorPulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.25); } }
    @media (max-width: 1180px) {
      .venue-map-svg { min-height: 640px !important; }
    }
    @media (max-width: 860px) {
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
  toolbarRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)',
    gap: '12px',
    alignItems: 'start',
  },
  searchLayer: {
    position: 'absolute',
    top: 18,
    left: 330,
    zIndex: 3,
    width: 340,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  breadcrumbs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    padding: '10px 14px',
    borderRadius: '14px',
    background: 'rgba(8, 8, 8, 0.72)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    backdropFilter: 'blur(14px)',
  },
  breadcrumbItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
    fontSize: 11,
    fontWeight: 700,
  },
  breadcrumbDivider: {
    color: 'var(--text-muted)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '16px',
    background: 'rgba(8, 8, 8, 0.82)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    backdropFilter: 'blur(14px)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: 'var(--font-body)',
  },
  searchResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px',
    borderRadius: '16px',
    background: 'rgba(8, 8, 8, 0.86)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    backdropFilter: 'blur(14px)',
    maxHeight: 240,
    overflowY: 'auto',
  },
  searchResultButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(241, 205, 122, 0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  searchResultMain: {
    fontSize: 12,
    fontWeight: 800,
  },
  searchResultMeta: {
    fontSize: 10,
    color: 'var(--text-muted)',
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
  phaseTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
  },
  phaseTab: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'flex-start',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-secondary)',
    borderRadius: '16px',
    padding: '10px 12px',
    cursor: 'pointer',
  },
  phaseTabActive: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'flex-start',
    border: '1px solid rgba(241, 205, 122, 0.32)',
    background: 'linear-gradient(145deg, rgba(241, 205, 122, 0.14) 0%, rgba(130, 92, 24, 0.08) 100%)',
    color: 'var(--text-primary)',
    borderRadius: '16px',
    padding: '10px 12px',
    cursor: 'pointer',
    boxShadow: '0 0 22px rgba(241, 205, 122, 0.06)',
  },
  phaseTabLabel: {
    fontSize: 12,
    fontWeight: 800,
  },
  phaseTabMeta: {
    fontSize: 10,
    color: 'var(--text-muted)',
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
  mapStage: {
    position: 'relative',
    minHeight: '780px',
  },
  mapHud: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 3,
    width: 290,
    padding: '16px 18px',
    borderRadius: '18px',
    background: 'rgba(8, 8, 8, 0.72)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    backdropFilter: 'blur(14px)',
  },
  zoomControls: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    borderRadius: '18px',
    background: 'rgba(8, 8, 8, 0.72)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    backdropFilter: 'blur(14px)',
  },
  iconButton: {
    width: 34,
    height: 34,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  zoomReadout: {
    minWidth: 48,
    textAlign: 'center',
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 700,
  },
  minimapCard: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    zIndex: 3,
    width: 220,
    padding: '12px',
    borderRadius: '18px',
    background: 'rgba(8, 8, 8, 0.76)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    backdropFilter: 'blur(14px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  minimapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    alignItems: 'center',
  },
  minimapTitle: {
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  minimapHint: {
    fontSize: 10,
    color: 'var(--text-muted)',
  },
  minimapSvg: {
    width: '100%',
    height: 142,
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
  },
  snapList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  snapButton: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    alignItems: 'center',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-secondary)',
    borderRadius: '10px',
    padding: '8px 10px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  snapButtonActive: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    alignItems: 'center',
    border: '1px solid rgba(241, 205, 122, 0.28)',
    background: 'rgba(241, 205, 122, 0.1)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    padding: '8px 10px',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  },
  snapDensity: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent-primary)',
    fontSize: 10,
  },
  svgShell: {
    overflow: 'hidden',
    borderRadius: '22px',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    background: 'radial-gradient(circle at 50% 30%, rgba(245, 215, 150, 0.06) 0%, rgba(8, 8, 8, 0.12) 52%, rgba(4, 4, 4, 0.42) 100%)',
  },
  svg: {
    width: '100%',
    height: 'auto',
    minHeight: '780px',
    display: 'block',
  },
  floatingInspector: {
    position: 'absolute',
    zIndex: 4,
    width: 280,
    padding: '16px',
    borderRadius: '18px',
    background: 'rgba(9, 9, 8, 0.9)',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.42)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inspectorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: '8px',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-secondary)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
  },
  bottomStrip: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(340px, 0.9fr)',
    gap: '18px',
    alignItems: 'start',
  },
  notesPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    borderRadius: '18px',
    background: 'rgba(13, 10, 8, 0.56)',
    border: '1px solid rgba(241, 205, 122, 0.1)',
  },
  zoneLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 700,
    fill: '#f8e5bb',
    paintOrder: 'stroke',
    stroke: 'rgba(9, 9, 8, 0.9)',
    strokeWidth: 3,
    pointerEvents: 'none',
  },
  zoneValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 600,
    fill: 'rgba(255, 244, 220, 0.86)',
    paintOrder: 'stroke',
    stroke: 'rgba(9, 9, 8, 0.9)',
    strokeWidth: 3,
    pointerEvents: 'none',
  },
  microZoneLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 9,
    fontWeight: 700,
    fill: 'rgba(250, 236, 200, 0.95)',
    letterSpacing: '0.04em',
    paintOrder: 'stroke',
    stroke: 'rgba(9, 9, 8, 0.92)',
    strokeWidth: 2.5,
    pointerEvents: 'none',
  },
  microZoneValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    fontWeight: 600,
    fill: 'rgba(255, 244, 220, 0.78)',
    paintOrder: 'stroke',
    stroke: 'rgba(9, 9, 8, 0.92)',
    strokeWidth: 2.5,
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
  amenityChipLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: '0.1em',
    fill: 'rgba(255, 239, 210, 0.86)',
    pointerEvents: 'none',
  },
  hudEyebrow: {
    fontFamily: 'var(--font-body)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'rgba(245, 223, 173, 0.62)',
  },
  hudTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    color: 'rgba(255, 244, 220, 0.96)',
    marginTop: 4,
  },
  hudSubtle: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    color: 'rgba(255, 239, 208, 0.68)',
    marginTop: 4,
    lineHeight: 1.5,
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
  drawerKicker: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    background: 'rgba(241, 205, 122, 0.08)',
    border: '1px solid rgba(241, 205, 122, 0.14)',
    color: 'var(--accent-primary)',
    fontSize: 11,
    fontWeight: 700,
    width: 'fit-content',
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
    lineHeight: 1.6,
  },
  snapInspectorButton: {
    border: '1px solid rgba(241, 205, 122, 0.2)',
    background: 'rgba(241, 205, 122, 0.08)',
    color: 'var(--accent-primary)',
    borderRadius: '12px',
    padding: '10px 12px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  feedCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px',
    borderRadius: '14px',
    background: 'linear-gradient(145deg, rgba(18, 16, 12, 0.86) 0%, rgba(10, 10, 8, 0.76) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.12)',
  },
  feedCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    alignItems: 'center',
  },
  feedPill: {
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--accent-primary)',
    fontWeight: 800,
  },
  feedStatus: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  feedTitle: {
    color: 'var(--text-primary)',
    fontWeight: 700,
    fontSize: 13,
  },
  feedMeta: {
    color: 'var(--text-secondary)',
    fontSize: 11,
  },
  emptyFeed: {
    color: 'var(--text-muted)',
    fontSize: 12,
    lineHeight: 1.6,
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
