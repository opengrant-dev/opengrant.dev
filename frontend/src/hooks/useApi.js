/**
 * Custom React hooks for API calls.
 * All hooks use axios and return { data, loading, error } state.
 */

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

// ---------------------------------------------------------------------------
// Submit a repo and get back a repo_id
// ---------------------------------------------------------------------------
export function useSubmitRepo() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const submit = useCallback(async (githubUrl) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API_BASE}/api/repos/submit`, { github_url: githubUrl })
      return res.data  // { repo_id, status, message }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Submission failed.'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { submit, loading, error }
}

// ---------------------------------------------------------------------------
// Poll repo status until "analyzed" or "error"
// ---------------------------------------------------------------------------
export function useRepoStatus(repoId) {
  const [repo, setRepo]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!repoId) return

    let cancelled = false
    let timer

    const poll = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API_BASE}/api/repos/${repoId}`)
        if (!cancelled) {
          setRepo(res.data)
          if (res.data.status === 'pending') {
            // Keep polling every 2 seconds while analysis is in progress
            timer = setTimeout(poll, 2000)
          } else {
            setLoading(false)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Could not fetch repo status.')
          setLoading(false)
        }
      }
    }

    poll()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [repoId])

  return { repo, loading, error }
}

// ---------------------------------------------------------------------------
// Fetch matches for a repo
// ---------------------------------------------------------------------------
export function useMatches(repoId, ready) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!repoId || !ready) return

    let cancelled = false

    const fetchMatches = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API_BASE}/api/repos/${repoId}/matches?limit=30`)
        if (!cancelled) {
          setMatches(res.data.matches || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Could not fetch matches.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMatches()
    return () => { cancelled = true }
  }, [repoId, ready])

  return { matches, loading, error }
}

// ---------------------------------------------------------------------------
// Fundability analysis for a repo
// ---------------------------------------------------------------------------
export function useFundability(repoId, ready) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!repoId || !ready) return
    let cancelled = false
    setLoading(true)
    axios.get(`${API_BASE}/api/repos/${repoId}/fundability`)
      .then(res => { if (!cancelled) setData(res.data) })
      .catch(err => { if (!cancelled) setError(err.response?.data?.detail || 'Could not load fundability.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [repoId, ready])

  return { data, loading, error }
}

// ---------------------------------------------------------------------------
// Generate a grant application
// ---------------------------------------------------------------------------
export function useGenerateApplication() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const generate = useCallback(async (repoId, fundingId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API_BASE}/api/repos/${repoId}/generate-application`, { funding_id: fundingId })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Generation failed.'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { generate, loading, error }
}

// ---------------------------------------------------------------------------
// Fetch platform stats for the landing page
// ---------------------------------------------------------------------------
export function useStats() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_BASE}/api/stats`)
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
