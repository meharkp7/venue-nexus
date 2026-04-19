// src/services/firebase.js
// Firebase SDK integration — Analytics + Firestore for VenueNexus
import { initializeApp } from 'firebase/app'
import { getAnalytics, logEvent } from 'firebase/analytics'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD-placeholder-replace-with-yours",
  authDomain: "model-osprey-489012-e3.firebaseapp.com",
  projectId: "model-osprey-489012-e3",
  storageBucket: "model-osprey-489012-e3.appspot.com",
  messagingSenderId: "980350937537",
  appId: "1:980350937537:web:replace-with-yours",
  measurementId: "G-REPLACE-WITH-YOURS"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Analytics
const analytics = getAnalytics(app)

// Firestore
const db = getFirestore(app)

// ─── Analytics helpers ────────────────────────────────────────────────────────

export function trackDashboardOpened() {
  logEvent(analytics, 'dashboard_opened', {
    timestamp: Date.now(),
  })
}

export function trackSimulationStarted(tick) {
  logEvent(analytics, 'simulation_started', {
    tick,
    timestamp: Date.now(),
  })
}

export function trackSimulationPaused(tick) {
  logEvent(analytics, 'simulation_paused', { tick })
}

export function trackAlertTriggered(alertLevel, nodeName) {
  logEvent(analytics, 'congestion_alert', {
    alert_level: alertLevel,
    node_name: nodeName,
  })
}

export function trackActionApproved(actionType, targetNode) {
  logEvent(analytics, 'action_approved', {
    action_type: actionType,
    target_node: targetNode,
  })
}

export function trackAgentQueried(question) {
  logEvent(analytics, 'agent_queried', {
    has_custom_question: !!question,
  })
}

export function trackWhatIfRun(scenarioCount) {
  logEvent(analytics, 'whatif_simulation_run', {
    scenario_count: scenarioCount,
  })
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

/**
 * Save a simulation snapshot to Firestore.
 * Called periodically during live simulation.
 */
export async function saveSimulationSnapshot(state, tick) {
  try {
    await addDoc(collection(db, 'simulation_snapshots'), {
      tick,
      overall_density: state.overall_density ?? null,
      event_phase: state.event_phase ?? null,
      node_count: state.nodes?.length ?? 0,
      alert_count: state.alerts?.length ?? 0,
      action_count: state.actions?.length ?? 0,
      timestamp: serverTimestamp(),
    })
  } catch (e) {
    // Non-blocking — snapshot failure should never break the simulation
    console.warn('Firestore snapshot failed (non-critical):', e.message)
  }
}

/**
 * Load the last N simulation snapshots from Firestore.
 * Used to show historical density trend on the analytics page.
 */
export async function loadRecentSnapshots(limitCount = 20) {
  try {
    const q = query(
      collection(db, 'simulation_snapshots'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (e) {
    console.warn('Firestore load failed (non-critical):', e.message)
    return []
  }
}

/**
 * Log a congestion event to Firestore for audit trail.
 */
export async function logCongestionEvent(nodeName, density, alertLevel) {
  try {
    await addDoc(collection(db, 'congestion_events'), {
      node_name: nodeName,
      density,
      alert_level: alertLevel,
      timestamp: serverTimestamp(),
    })
  } catch (e) {
    console.warn('Firestore event log failed (non-critical):', e.message)
  }
}

export { analytics, db }