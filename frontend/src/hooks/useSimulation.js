import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api'
import {
  trackSimulationStarted,
  trackSimulationPaused,
  trackAlertTriggered,
  saveSimulationSnapshot,
  logCongestionEvent,
} from '../services/firebase'

// Save a Firestore snapshot every N ticks (not every tick — avoids quota)
const SNAPSHOT_INTERVAL = 5

export function useSimulation() {
  const [state, setState]       = useState(null)
  const [tick, setTick]         = useState(0)
  const [running, setRunning]   = useState(false)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const intervalRef             = useRef(null)
  const lastSnapshotTick        = useRef(-1)

  const fetchTick = useCallback(async (t) => {
    setLoading(true)
    try {
      const data = await api.tick(t)
      setState(data)
      setTick(t + 1)
      setError(null)

      // Track analytics for alerts
      if (data.alerts?.length > 0) {
        data.alerts.forEach(alert => {
          if (alert.alert_level === 'critical' || alert.alert_level === 'high') {
            trackAlertTriggered(alert.alert_level, alert.node_name)
            logCongestionEvent(alert.node_name, alert.density, alert.alert_level)
          }
        })
      }

      // Save Firestore snapshot every SNAPSHOT_INTERVAL ticks
      if (t - lastSnapshotTick.current >= SNAPSHOT_INTERVAL) {
        lastSnapshotTick.current = t
        saveSimulationSnapshot(data, t)
      }

    } catch (e) {
      setError(e.message)
      setRunning(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    api.reset()
      .then(() => fetchTick(0))
      .catch(e => setError(e.message))
  }, [fetchTick])

  // Auto-tick every 2s when running
  useEffect(() => {
    if (running) {
      trackSimulationStarted(tick)
      intervalRef.current = setInterval(() => {
        setTick(prev => {
          fetchTick(prev)
          return prev  // actual increment happens in fetchTick
        })
      }, 2000)
    } else {
      if (tick > 0) trackSimulationPaused(tick)
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, fetchTick])

  const handleReset = useCallback(async () => {
    setRunning(false)
    clearInterval(intervalRef.current)
    await api.reset()
    await fetchTick(0)
    setError(null)
    lastSnapshotTick.current = -1
  }, [fetchTick])

  const stepOnce = useCallback(() => {
    fetchTick(tick)
  }, [tick, fetchTick])

  return {
    state, tick, running, error, loading,
    setRunning, handleReset, stepOnce,
  }
}