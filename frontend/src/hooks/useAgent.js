import { useState, useCallback } from 'react'
import { api } from '../services/api'

export function useAgent() {
  const [strategy, setStrategy] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [lastQuestion, setLastQuestion] = useState(null)
  const [history, setHistory] = useState([])

  const query = useCallback(async (question = null) => {
    setLoading(true)
    setError(null)
    setLastQuestion(question)
    try {
      const data = await api.getStrategy(question)
      setStrategy(data)
      setHistory(prev => [
        {
          id: Date.now(),
          question: question || 'Generate Strategy',
          responseSummary: data?.data?.summary || data?.strategy || 'Strategy generated',
          structured: Boolean(data?.structured),
        },
        ...prev,
      ].slice(0, 6))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { strategy, loading, error, query, lastQuestion, history }
}
