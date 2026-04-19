const FLOORPLAN_ZONES = {
  gate_a: {
    label: 'Gate A',
    zoneType: 'gate',
    polygon: '455,36 545,36 570,78 430,78',
    center: { x: 500, y: 57 },
    sensors: ['camera', 'footfall'],
    inflowSource: 'North arrival plaza',
    actionHint: 'Stage two stewards at turnstiles and open overflow screening lane.',
  },
  gate_b: {
    label: 'Gate B',
    zoneType: 'gate',
    polygon: '455,622 545,622 570,664 430,664',
    center: { x: 500, y: 643 },
    sensors: ['camera', 'footfall'],
    inflowSource: 'South arrival plaza',
    actionHint: 'Open south queue split and rebalance arrivals to Gate D.',
  },
  gate_c: {
    label: 'Gate C',
    zoneType: 'gate',
    polygon: '864,295 958,325 944,380 850,350',
    center: { x: 904, y: 338 },
    sensors: ['camera', 'footfall'],
    inflowSource: 'East drop-off',
    actionHint: 'Reduce queue buildup by diverting late arrivals to Gate A.',
  },
  gate_d: {
    label: 'Gate D',
    zoneType: 'gate',
    polygon: '136,325 150,380 56,350 42,295',
    center: { x: 96, y: 338 },
    sensors: ['camera', 'footfall'],
    inflowSource: 'West transit plaza',
    actionHint: 'Push signage to west plaza and meter arrivals toward Gate B.',
  },
  concourse_n: {
    label: 'North Concourse',
    zoneType: 'concourse',
    polygon: '252,118 748,118 712,202 288,202',
    center: { x: 500, y: 160 },
    sensors: ['camera', 'camera', 'iot'],
    inflowSource: 'Gate A and Sections 101/102',
    actionHint: 'Trigger one-way guidance and re-route northbound traffic to East Concourse.',
  },
  concourse_s: {
    label: 'South Concourse',
    zoneType: 'concourse',
    polygon: '288,498 712,498 748,582 252,582',
    center: { x: 500, y: 540 },
    sensors: ['camera', 'camera', 'iot'],
    inflowSource: 'Gate B and Sections 103/104',
    actionHint: 'Open south express lane and increase exit stewarding near kiosks.',
  },
  concourse_e: {
    label: 'East Concourse',
    zoneType: 'concourse',
    polygon: '748,202 844,250 844,450 748,498 688,430 688,270',
    center: { x: 760, y: 350 },
    sensors: ['camera', 'camera', 'iot'],
    inflowSource: 'Gate C, Section 102, Section 104',
    actionHint: 'Deploy dynamic signage toward West Concourse and pause promo notifications.',
  },
  concourse_w: {
    label: 'West Concourse',
    zoneType: 'concourse',
    polygon: '156,250 252,202 312,270 312,430 252,498 156,450',
    center: { x: 240, y: 350 },
    sensors: ['camera', 'camera', 'iot'],
    inflowSource: 'Gate D, Section 101, Section 103',
    actionHint: 'Move queue barriers outward and redirect staff to food court edge.',
  },
  concession_1: {
    label: 'Concession A',
    zoneType: 'concession',
    polygon: '384,210 468,210 482,260 370,260',
    center: { x: 426, y: 236 },
    sensors: ['camera', 'pos'],
    inflowSource: 'North Concourse spillover',
    actionHint: 'Open mobile pickup lane and pause fresh promo messaging.',
  },
  concession_2: {
    label: 'Concession B',
    zoneType: 'concession',
    polygon: '532,440 630,440 616,492 518,492',
    center: { x: 574, y: 466 },
    sensors: ['camera', 'pos'],
    inflowSource: 'South Concourse spillover',
    actionHint: 'Shift one cashier and direct mobile orders to adjacent pickup shelf.',
  },
  concession_3: {
    label: 'Concession C',
    zoneType: 'concession',
    polygon: '702,312 760,286 804,356 746,382',
    center: { x: 752, y: 334 },
    sensors: ['camera', 'pos'],
    inflowSource: 'East Concourse queue',
    actionHint: 'Throttle queue intake and promote nearby alternate kiosk.',
  },
  sector_101: {
    label: 'Section 101',
    zoneType: 'section',
    polygon: '286,218 468,218 430,332 256,332',
    center: { x: 362, y: 278 },
    sensors: ['camera', 'seat'],
    inflowSource: 'North west seating block',
    actionHint: 'Pre-stage ushers and recommend alternate egress for lower rows.',
  },
  sector_102: {
    label: 'Section 102',
    zoneType: 'section',
    polygon: '532,218 714,218 744,332 570,332',
    center: { x: 638, y: 278 },
    sensors: ['camera', 'seat'],
    inflowSource: 'North east seating block',
    actionHint: 'Stagger release messaging and push guests toward East Concourse exits.',
  },
  sector_103: {
    label: 'Section 103',
    zoneType: 'section',
    polygon: '256,368 430,368 468,482 286,482',
    center: { x: 362, y: 422 },
    sensors: ['camera', 'seat'],
    inflowSource: 'South west seating block',
    actionHint: 'Hold lower bowl release for 90 seconds and monitor aisle density.',
  },
  sector_104: {
    label: 'Section 104',
    zoneType: 'section',
    polygon: '570,368 744,368 714,482 532,482',
    center: { x: 638, y: 422 },
    sensors: ['camera', 'seat'],
    inflowSource: 'South east seating block',
    actionHint: 'Route aisles to east stairs and trigger staff assist notification.',
  },
  exit_1: {
    label: 'North Exit',
    zoneType: 'exit',
    polygon: '438,10 562,10 584,34 416,34',
    center: { x: 500, y: 22 },
    sensors: ['camera', 'footfall'],
    inflowSource: 'North egress lane',
    actionHint: 'Keep all lanes open and maintain outbound flow.',
  },
  exit_2: {
    label: 'South Exit',
    zoneType: 'exit',
    polygon: '416,666 584,666 562,690 438,690',
    center: { x: 500, y: 678 },
    sensors: ['camera', 'footfall'],
    inflowSource: 'South egress lane',
    actionHint: 'Add temporary rails and push crowd to wider apron.',
  },
  exit_3: {
    label: 'East Exit',
    zoneType: 'exit',
    polygon: '964,320 990,338 964,356 934,338',
    center: { x: 962, y: 338 },
    sensors: ['camera', 'footfall'],
    inflowSource: 'East perimeter lane',
    actionHint: 'Extend exit funnel and broadcast eastern dispersal route.',
  },
  exit_4: {
    label: 'West Exit',
    zoneType: 'exit',
    polygon: '66,338 36,356 10,338 36,320',
    center: { x: 38, y: 338 },
    sensors: ['camera', 'footfall'],
    inflowSource: 'West perimeter lane',
    actionHint: 'Direct ushers to west stairs and open exterior buffer area.',
  },
}

const DEFAULT_ZONE = {
  zoneType: 'zone',
  polygon: '450,310 550,310 550,390 450,390',
  center: { x: 500, y: 350 },
  sensors: ['camera'],
  inflowSource: 'Mixed venue traffic',
  actionHint: 'Review live feed and rebalance traffic from adjacent corridors.',
}

const SENSOR_LABELS = {
  camera: 'Camera',
  footfall: 'FootfallSensor',
  iot: 'OccupancySensor',
  pos: 'POSCounter',
  seat: 'SeatCounter',
}

const SENSOR_OFFSETS = {
  camera: [{ x: -36, y: -26 }, { x: 38, y: -22 }, { x: 0, y: -42 }],
  footfall: [{ x: 0, y: 28 }, { x: -24, y: 30 }],
  iot: [{ x: 0, y: 34 }],
  pos: [{ x: 30, y: 10 }, { x: -24, y: 12 }],
  seat: [{ x: 0, y: -34 }, { x: 0, y: 36 }],
}

const SENSOR_PREFIX = {
  camera: 'CCTV',
  footfall: 'FootfallSensor',
  iot: 'IoT',
  pos: 'POS',
  seat: 'Seat',
}

const MICRO_ZONE_TEMPLATES = {
  sector_101: [
    { suffix: 'A', label: '101A', polygon: '294,226 382,226 364,294 280,294', center: { x: 330, y: 258 }, bias: -0.06 },
    { suffix: 'B', label: '101B', polygon: '388,226 458,226 440,294 372,294', center: { x: 414, y: 258 }, bias: 0.03 },
    { suffix: 'C', label: '101C', polygon: '276,300 438,300 420,326 266,326', center: { x: 352, y: 314 }, bias: 0.08 },
  ],
  sector_102: [
    { suffix: 'A', label: '102A', polygon: '542,226 612,226 626,294 558,294', center: { x: 584, y: 258 }, bias: -0.02 },
    { suffix: 'B', label: '102B', polygon: '618,226 706,226 724,294 640,294', center: { x: 670, y: 258 }, bias: 0.05 },
    { suffix: 'C', label: '102C', polygon: '564,300 726,300 736,326 582,326', center: { x: 648, y: 314 }, bias: 0.1 },
  ],
  sector_103: [
    { suffix: 'A', label: '103A', polygon: '266,374 420,374 438,402 276,402', center: { x: 352, y: 390 }, bias: 0.07 },
    { suffix: 'B', label: '103B', polygon: '280,408 364,408 382,474 294,474', center: { x: 330, y: 440 }, bias: -0.04 },
    { suffix: 'C', label: '103C', polygon: '372,408 440,408 458,474 388,474', center: { x: 414, y: 440 }, bias: 0.02 },
  ],
  sector_104: [
    { suffix: 'A', label: '104A', polygon: '582,374 736,374 726,402 564,402', center: { x: 648, y: 390 }, bias: 0.12 },
    { suffix: 'B', label: '104B', polygon: '558,408 626,408 612,474 542,474', center: { x: 584, y: 440 }, bias: -0.03 },
    { suffix: 'C', label: '104C', polygon: '640,408 724,408 706,474 618,474', center: { x: 670, y: 440 }, bias: 0.04 },
  ],
  concourse_n: [
    { suffix: 'W', label: 'North West Portal', polygon: '274,128 410,128 394,186 288,186', center: { x: 342, y: 156 }, bias: 0.04 },
    { suffix: 'C', label: 'North Central Portal', polygon: '420,128 580,128 580,186 420,186', center: { x: 500, y: 156 }, bias: 0.08 },
    { suffix: 'E', label: 'North East Portal', polygon: '590,128 726,128 712,186 606,186', center: { x: 658, y: 156 }, bias: -0.01 },
  ],
  concourse_s: [
    { suffix: 'W', label: 'South West Portal', polygon: '288,514 394,514 410,572 274,572', center: { x: 342, y: 544 }, bias: -0.02 },
    { suffix: 'C', label: 'South Central Portal', polygon: '420,514 580,514 580,572 420,572', center: { x: 500, y: 544 }, bias: 0.06 },
    { suffix: 'E', label: 'South East Portal', polygon: '606,514 712,514 726,572 590,572', center: { x: 658, y: 544 }, bias: 0.03 },
  ],
  concourse_e: [
    { suffix: 'N', label: 'East Upper Walk', polygon: '748,216 822,252 792,314 724,276', center: { x: 776, y: 266 }, bias: 0.02 },
    { suffix: 'C', label: 'East Club Walk', polygon: '722,286 804,330 804,372 724,348', center: { x: 764, y: 330 }, bias: 0.09 },
    { suffix: 'S', label: 'East Lower Walk', polygon: '724,360 792,386 822,448 748,484', center: { x: 776, y: 424 }, bias: 0.05 },
  ],
  concourse_w: [
    { suffix: 'N', label: 'West Upper Walk', polygon: '178,252 252,216 276,276 208,314', center: { x: 224, y: 266 }, bias: 0.01 },
    { suffix: 'C', label: 'West Club Walk', polygon: '196,330 276,286 276,348 196,372', center: { x: 236, y: 330 }, bias: 0.07 },
    { suffix: 'S', label: 'West Lower Walk', polygon: '208,386 276,360 252,484 178,448', center: { x: 224, y: 424 }, bias: -0.03 },
  ],
}

function getStatusColor(status) {
  if (status === 'red') return '#ef4444'
  if (status === 'yellow') return '#f59e0b'
  return '#10b981'
}

function inferZone(node) {
  const base = FLOORPLAN_ZONES[node.id] || DEFAULT_ZONE
  const predictedDensity = typeof node.predicted_density === 'number' ? node.predicted_density : node.density
  const confidence = typeof node.forecast_confidence === 'number' ? node.forecast_confidence : 0.86
  const direction = node.trend === 'rising' || node.trend === 'up'
    ? 'Increasing'
    : node.trend === 'falling' || node.trend === 'down'
      ? 'Declining'
      : 'Stable'

  return {
    ...base,
    id: node.id,
    name: node.name || base.label || node.id,
    label: base.label || node.name || node.id,
    density: typeof node.density === 'number' ? node.density : 0,
    predictedDensity,
    status: node.status || (node.density > 0.8 ? 'red' : node.density > 0.5 ? 'yellow' : 'green'),
    currentOccupancy: node.current_occupancy || 0,
    capacity: node.capacity || 0,
    confidence,
    trendLabel: direction,
    dominantInflowSource: base.inflowSource,
    recommendedAction: base.actionHint,
    riskLevel: predictedDensity >= 0.9 ? 'Critical' : predictedDensity >= 0.75 ? 'Elevated' : 'Observed',
    edgeGlow: predictedDensity >= 0.8 || node.status === 'red',
    color: getStatusColor(node.status),
  }
}

function buildSensors(zones) {
  return zones.flatMap((zone, zoneIndex) => {
    const usage = {}
    return (zone.sensors || []).map((sensorType, sensorIndex) => {
      const variants = SENSOR_OFFSETS[sensorType] || [{ x: 0, y: 0 }]
      const offsetIndex = usage[sensorType] || 0
      usage[sensorType] = offsetIndex + 1
      const offset = variants[offsetIndex % variants.length]
      const sensorId = `${SENSOR_PREFIX[sensorType] || sensorType}-${zoneIndex + 1}${sensorIndex + 1}`
      return {
        id: `${zone.id}-${sensorType}-${sensorIndex}`,
        zoneId: zone.id,
        zoneName: zone.label,
        type: sensorType,
        label: sensorId,
        title: `${SENSOR_LABELS[sensorType] || sensorType} ${sensorId}`,
        x: zone.center.x + offset.x,
        y: zone.center.y + offset.y,
        reading: Math.round(zone.density * 100),
      }
    })
  })
}

function deriveMicroZones(zones) {
  return zones.flatMap((zone) => {
    const templates = MICRO_ZONE_TEMPLATES[zone.id] || []
    return templates.map((template, index) => {
      const density = clamp(zone.density + template.bias, 0.08, 0.99)
      const predictedDensity = clamp(zone.predictedDensity + template.bias * 0.7, 0.08, 0.99)
      const status = predictedDensity >= 0.8 ? 'red' : predictedDensity >= 0.5 ? 'yellow' : 'green'
      return {
        ...zone,
        id: `${zone.id}-${template.suffix}`,
        label: template.label,
        shortLabel: template.label,
        polygon: template.polygon,
        center: template.center,
        density,
        predictedDensity,
        status,
        riskLevel: predictedDensity >= 0.9 ? 'Critical' : predictedDensity >= 0.75 ? 'Elevated' : 'Observed',
        edgeGlow: predictedDensity >= 0.82,
        color: getStatusColor(status),
        parentId: zone.id,
        isVirtual: true,
        selectable: true,
      }
    })
  })
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function pathForEdge(source, target) {
  const sx = source.center.x
  const sy = source.center.y
  const tx = target.center.x
  const ty = target.center.y
  const dx = tx - sx
  const dy = ty - sy
  const curve = Math.abs(dx) > Math.abs(dy) ? Math.max(28, Math.abs(dy) * 0.45) : Math.max(28, Math.abs(dx) * 0.45)
  const c1x = sx + dx * 0.35 + (Math.abs(dx) > Math.abs(dy) ? 0 : (dx >= 0 ? curve : -curve))
  const c1y = sy + dy * 0.2 + (Math.abs(dx) > Math.abs(dy) ? (dy >= 0 ? curve : -curve) : 0)
  const c2x = sx + dx * 0.72 - (Math.abs(dx) > Math.abs(dy) ? 0 : (dx >= 0 ? curve : -curve))
  const c2y = sy + dy * 0.82 - (Math.abs(dx) > Math.abs(dy) ? (dy >= 0 ? curve : -curve) : 0)
  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`
}

export function buildVenueFloorplan(nodes = [], edges = []) {
  const baseZones = nodes.map(inferZone)
  const microZones = deriveMicroZones(baseZones)
  const zones = [...baseZones, ...microZones]
  const zoneMap = Object.fromEntries(baseZones.map(zone => [zone.id, zone]))
  const corridors = edges
    .map((edge, index) => {
      const source = zoneMap[edge.source]
      const target = zoneMap[edge.target]
      if (!source || !target) return null
      const utilization = typeof edge.utilization === 'number'
        ? edge.utilization
        : typeof edge.flow_rate === 'number' && (edge.capacity || edge.max_flow)
          ? Math.min(1, edge.flow_rate / (edge.capacity || edge.max_flow))
          : source && target
            ? Math.min(1, (source.density + target.density) / 2)
            : 0.2
      return {
        id: `${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        path: pathForEdge(source, target),
        utilization,
        footfallLabel: `${Math.round(utilization * 100)}% footfall`,
        saturated: Boolean(edge.is_saturated) || utilization > 0.82,
      }
    })
    .filter(Boolean)

  const sensors = buildSensors(baseZones)
  return { zones, corridors, sensors }
}
