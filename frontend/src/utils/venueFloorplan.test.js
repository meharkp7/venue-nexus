import test from 'node:test'
import assert from 'node:assert/strict'

import { buildVenueFloorplan } from './venueFloorplan.js'

test('buildVenueFloorplan maps nodes into zones, corridors, and sensors', () => {
  const result = buildVenueFloorplan(
    [
      {
        id: 'concourse_n',
        name: 'North Concourse',
        node_type: 'concourse',
        density: 0.72,
        current_occupancy: 72,
        capacity: 100,
        status: 'yellow',
        predicted_density: 0.86,
        forecast_confidence: 0.91,
        trend: 'rising',
      },
      {
        id: 'sector_101',
        name: 'Section 101',
        node_type: 'section',
        density: 0.46,
        current_occupancy: 46,
        capacity: 100,
        status: 'green',
        predicted_density: 0.52,
        forecast_confidence: 0.84,
        trend: 'stable',
      },
    ],
    [
      {
        source: 'concourse_n',
        target: 'sector_101',
        utilization: 0.55,
        is_saturated: false,
      },
    ],
  )

  assert.ok(result.zones.length >= 2)
  assert.equal(result.corridors.length, 1)
  assert.ok(result.sensors.length >= 1)
  assert.ok(result.amenities.length >= 1)
  assert.ok(result.circulation.length >= 1)
})

test('buildVenueFloorplan creates micro-zones for main arena sections', () => {
  const result = buildVenueFloorplan(
    [
      {
        id: 'sector_101',
        name: 'Section 101',
        node_type: 'section',
        density: 0.66,
        current_occupancy: 66,
        capacity: 100,
        status: 'yellow',
        predicted_density: 0.74,
        forecast_confidence: 0.89,
        trend: 'rising',
      },
    ],
    [],
  )

  const microZones = result.zones.filter(zone => zone.parentId === 'sector_101')
  assert.ok(microZones.length >= 3)
  assert.ok(microZones.every(zone => zone.level === 'bowl'))
})
