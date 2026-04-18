const BASE = '/api'
const API_KEY = import.meta.env.VITE_API_KEY || 'venue-nexus-demo'

function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra }
  headers['x-api-key'] = API_KEY
  return headers
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  // Status
  getStatus:     ()           => request('/status/'),
  getNode:       (id)         => request(`/status/node/${id}`),

  // Simulation
  tick:          (tick)       => request('/simulation/tick', {
    method: 'POST',
    body: JSON.stringify({ tick }),
  }),
  reset:         ()           => request('/simulation/reset', { method: 'POST' }),
  getScenario:   ()           => request('/simulation/scenario'),

  // Nudges
  getNudges:     ()           => request('/nudge/'),

  // Agent
  getStrategy:   (question)   => request('/agent/strategy', {
    method: 'POST',
    body: JSON.stringify({ question: question || null }),
  }),
  getDecisions:  ()           => request('/agent/decisions'),
  approveAction: (actionId, approved, reason) => request('/agent/action/approve', {
    method: 'POST',
    body: JSON.stringify({ action_id: actionId, approved, reason }),
  }),
  executeAction: (actionId)   => request('/agent/action/execute', {
    method: 'POST',
    body: JSON.stringify({ action_id: actionId, approved: true }),
  }),
  runWhatIf:     (question)   => request('/agent/whatif', {
    method: 'POST',
    body: JSON.stringify({ question: question || null }),
  }),

  // KPIs
  getKpiHistory: ()           => request('/kpi/'),
  getKpiSummary: ()           => request('/kpi/summary'),

  // Health
  getHealth:     ()           => request('/health/'),
  getMetrics:    ()           => request('/health/metrics'),
}
