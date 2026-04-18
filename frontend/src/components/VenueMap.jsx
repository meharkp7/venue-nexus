import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'

const STATUS_COLOR = { 
  green: '#10b981', 
  yellow: '#f59e0b', 
  red: '#ef4444' 
}
const TYPE_SHAPE = {
  gate:       { r: 6,  label: 'G' },
  concourse:  { r: 10, label: 'C' },
  concession: { r: 5,  label: '$' },
  exit:       { r: 7,  label: 'E' },
  sector:     { r: 9,  label: 'S' },
}

export default function VenueMap({ nodes = [], edges = [] }) {
  const [hovered, setHovered] = useState(null)

  // Map node IDs to positions for edge drawing
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })

  const W = 600, H = 420

  return (
    <div style={styles.wrap} className="card widget-float">
      <div style={styles.title}>VENUE MAP — LIVE DENSITY</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={styles.svg}>
        <defs>
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <radialGradient key={status} id={`grad-${status}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const src = nodeMap[e.source], tgt = nodeMap[e.target]
          if (!src || !tgt) return null
          const sx = (src.x / 100) * W, sy = (src.y / 100) * H
          const tx = (tgt.x / 100) * W, ty = (tgt.y / 100) * H
          const saturated = e.is_saturated
          const utilization = e.utilization || 0
          return (
            <line key={i}
              x1={sx} y1={sy} x2={tx} y2={ty}
              stroke={saturated ? 'var(--accent-danger)' : 'rgba(241, 205, 122, 0.18)'}
              strokeWidth={saturated ? 2.4 : 1.2 + utilization}
              strokeOpacity={saturated ? 0.85 : 0.35 + utilization * 0.45}
              strokeDasharray={utilization > 0.35 ? '7 5' : 'none'}
              style={utilization > 0.35 ? {
                animation: 'flowDash 1.6s linear infinite',
              } : undefined}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const cx = (node.x / 100) * W
          const cy = (node.y / 100) * H
          const color = STATUS_COLOR[node.status] || '#7a9ab0'
          const { r } = TYPE_SHAPE[node.node_type] || { r: 10 }
          const isHovered = hovered === node.id
          const futureDensity = typeof node.predicted_density === 'number' ? node.predicted_density : null
          const futureRisk = futureDensity != null && futureDensity > node.density + 0.05

          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>

              {/* Minimal shadow */}
              <circle cx={cx + 0.5} cy={cy + 0.5} r={r}
                fill="rgba(0, 0, 0, 0.2)"
                style={{ filter: 'blur(0.5px)' }}
              />

              {/* Subtle glow for alerts only */}
              {node.status === 'red' && (
                <circle cx={cx} cy={cy} r={r + 6}
                  fill={`url(#grad-${node.status})`}
                  style={{ filter: 'blur(1.5px)' }}
                />
              )}

              {futureRisk && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 10}
                  fill="none"
                  stroke="rgba(241, 205, 122, 0.6)"
                  strokeWidth={1.2}
                  strokeDasharray="4 4"
                  style={{ animation: 'pulse-dot 2.2s ease-in-out infinite' }}
                />
              )}

              {/* Gentle pulse for critical nodes */}
              {node.status === 'red' && (
                <circle cx={cx} cy={cy} r={r + 3}
                  fill="none" stroke="#ef4444" strokeWidth={1}
                  strokeOpacity={0.6}
                  style={{ animation: 'pulse-dot 3s ease-in-out infinite' }} />
              )}

              {/* Clean main node */}
              <circle cx={cx} cy={cy} r={r}
                fill="rgba(14, 11, 8, 0.96)"
                stroke={color}
                strokeWidth={isHovered ? 2 : 1.5}
                style={{
                  transition: 'all 0.3s ease',
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                }}
              />

              {/* Compact density indicator */}
              <circle cx={cx} cy={cy - r + (node.density * r * 1.2)}
                r={r * 0.3}
                fill={color}
                fillOpacity={0.9}
                style={{
                  transition: 'all 0.4s ease',
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                }}
              />

              {/* Compact trend indicator */}
              {node.trend && node.status !== 'green' && (
                <g transform={`translate(${cx + r + 2}, ${cy - r - 2})`}>
                  {node.trend === 'up' && (
                    <TrendingUp size={8} color="#dc2626" strokeWidth={1.5} />
                  )}
                  {node.trend === 'down' && (
                    <TrendingDown size={8} color="#16a34a" strokeWidth={1.5} />
                  )}
                  {node.trend === 'stable' && (
                    <Minus size={8} color="#6b7280" strokeWidth={1.5} />
                  )}
                </g>
              )}

              {/* Future prediction only for critical */}
              {node.predicted_density && node.predicted_density > 0.8 && node.status === 'red' && (
                <g>
                  <circle cx={cx} cy={cy} r={r + 12}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={1}
                    strokeOpacity={0.5}
                    strokeDasharray="2 2"
                    style={{ animation: 'pulse-dot 2.5s ease-in-out infinite' }}
                  />
                  <g transform={`translate(${cx + r + 15}, ${cy})`}>
                    <Clock size={8} color="#fbbf24" />
                    <text x={10} y={2}
                      fontSize={7}
                      fill="#fbbf24"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      fontWeight="600">
                      {Math.round(node.predicted_density * 100)}%
                    </text>
                  </g>
                </g>
              )}

              {/* Minimal label - positioned to avoid overlap */}
              <text x={cx} y={cy + r + 10}
                textAnchor="middle" fontSize={7}
                fill={isHovered ? '#f5dfad' : 'rgba(245, 226, 190, 0.56)'}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={isHovered ? '600' : '500'}
                style={{ transition: 'all 0.2s' }}>
                {node.name.split('_')[0].toUpperCase()}
              </text>

              {/* Clean density tooltip - positioned above */}
              {isHovered && (
                <g style={{ animation: 'fade-in 0.2s ease-out' }}>
                  <rect x={cx - 16} y={cy - 28} width={32} height={14}
                    fill="rgba(10, 9, 7, 0.96)" stroke={color} strokeWidth={1} rx={2}
                    opacity={0.95}
                  />
                  <text x={cx} y={cy - 18}
                    textAnchor="middle" fontSize={8}
                    fill={color}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight="700">
                    {Math.round(node.density * 100)}%
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={styles.legend}>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <div key={s} style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: c }} />
            <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 10 }}>{s}</span>
          </div>
        ))}
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendLine, borderTop: '2px dashed var(--accent-danger)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>SATURATED EDGE</span>
        </div>
        <div style={styles.legendItem}>
          <TrendingUp size={10} color="#dc2626" />
          <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>INCREASING</span>
        </div>
        <div style={styles.legendItem}>
          <TrendingDown size={10} color="#16a34a" />
          <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>DECREASING</span>
        </div>
        <div style={styles.legendItem}>
          <Clock size={10} color="#fbbf24" />
          <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>FUTURE PREDICTION</span>
        </div>
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1],16)}, ${parseInt(result[2],16)}, ${parseInt(result[3],16)}`
    : '255,255,255'
}

if (typeof document !== 'undefined' && !document.getElementById('venue-map-flow-style')) {
  const style = document.createElement('style')
  style.id = 'venue-map-flow-style'
  style.innerHTML = '@keyframes flowDash { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }'
  document.head.appendChild(style)
}

const styles = {
  wrap: {
    background: 'linear-gradient(145deg, rgba(18, 15, 10, 0.88) 0%, rgba(10, 9, 7, 0.82) 100%)',
    border: '1px solid rgba(241, 205, 122, 0.16)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 18px 44px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 242, 216, 0.06)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '20px',
    textAlign: 'center',
    letterSpacing: '0.025em',
  },
  svg: {
    width: '100%',
    height: 'auto',
    background: 'linear-gradient(135deg, rgba(10, 9, 7, 0.96) 0%, rgba(20, 15, 10, 0.9) 100%)',
    borderRadius: '12px',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    marginBottom: '20px',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '20px',
    justifyContent: 'center',
    padding: '16px',
    background: 'linear-gradient(135deg, rgba(22, 17, 11, 0.9) 0%, rgba(11, 10, 8, 0.84) 100%)',
    borderRadius: '12px',
    border: '1px solid rgba(241, 205, 122, 0.12)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(12, 10, 8, 0.92)',
    borderRadius: '8px',
    border: '1px solid rgba(241, 205, 122, 0.12)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.24)',
    transition: 'all 0.2s ease',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid rgba(8, 8, 7, 0.92)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
  },
  legendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    border: '1px solid rgba(8, 8, 7, 0.92)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
}
