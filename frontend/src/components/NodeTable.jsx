import React, { useState } from 'react'
import { Table } from 'lucide-react'

const STATUS_COLOR = { green: 'var(--accent-success)', yellow: 'var(--accent-warning)', red: 'var(--accent-danger)' }

export default function NodeTable({ nodes = [] }) {
  const [sort, setSort] = useState({ key: 'density', dir: -1 })

  const sorted = [...nodes].sort((a, b) => {
    const va = a[sort.key], vb = b[sort.key]
    return typeof va === 'string' ? va.localeCompare(vb) * sort.dir : (va - vb) * sort.dir
  })

  const toggleSort = (key) => {
    setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }))
  }

  const Th = ({ label, field }) => (
    <th style={styles.th} onClick={() => toggleSort(field)}>
      {label}
      {sort.key === field && <span style={{ color: 'var(--accent-primary)' }}> {sort.dir === -1 ? '↓' : '↑'}</span>}
    </th>
  )

  return (
    <div style={styles.wrap} className="card widget-float">
      <div style={styles.header}>
        <Table size={12} color="var(--text-muted)" />
        <span style={styles.title}>NODE STATUS TABLE</span>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.trHead}>
              <Th label="Node" field="name" />
              <Th label="Type" field="node_type" />
              <Th label="Occupancy" field="current_occupancy" />
              <Th label="Capacity" field="capacity" />
              <Th label="Density" field="density" />
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(node => (
              <tr key={node.id} style={styles.tr}>
                <td style={styles.td}>{node.name}</td>
                <td style={{ ...styles.td, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {node.node_type}
                </td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)' }}>
                  {node.current_occupancy}
                </td>
                <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {node.capacity}
                </td>
                <td style={styles.td}>
                  <div style={styles.densityCell}>
                    <div style={styles.miniBar}>
                      <div style={{ ...styles.miniBarFill,
                        width: `${Math.round(node.density * 100)}%`,
                        background: STATUS_COLOR[node.status] || '#7a9ab0' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                      color: STATUS_COLOR[node.status] }}>
                      {Math.round(node.density * 100)}%
                    </span>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.statusPill,
                    color: STATUS_COLOR[node.status],
                    background: `${STATUS_COLOR[node.status]}15`,
                    border: `1px solid ${STATUS_COLOR[node.status]}40`,
                  }}>
                    {node.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  header: { display: 'flex', alignItems: 'center', gap: 7 },
  title: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-muted)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  trHead: { borderBottom: '1px solid var(--border)' },
  th: {
    textAlign: 'left', padding: '6px 10px', fontSize: 10,
    color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid var(--border)', transition: 'background 0.15s' },
  td: { padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap' },
  densityCell: { display: 'flex', alignItems: 'center', gap: 8 },
  miniBar: { width: 60, height: 4, background: 'var(--bg-base)', borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2, transition: 'width 0.5s ease' },
  statusPill: { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 20 },
}
