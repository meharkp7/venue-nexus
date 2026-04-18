import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/api'

export function useSimulation() {
  const [state, setState]       = useState(null)
  const [tick, setTick]         = useState(0)
  const [running, setRunning]   = useState(false)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const intervalRef             = useRef(null)

  const fetchTick = useCallback(async (t) => {
    setLoading(true)
    try {
      const data = await api.tick(t)
      setState(data)
      setTick(t + 1)
      setError(null)
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
      intervalRef.current = setInterval(() => {
        setTick(prev => {
          fetchTick(prev)
          return prev  // actual increment happens in fetchTick
        })
      }, 2000)
    } else {
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
  }, [fetchTick])

  const stepOnce = useCallback(() => {
    fetchTick(tick)
  }, [tick, fetchTick])

  return {
    state, tick, running, error, loading,
    setRunning, handleReset, stepOnce,
  }
}
