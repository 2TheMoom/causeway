import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAllRequests, fetchChains, isValidAddress, type RelayChain } from '../lib/relay'
import { computeStats, type AddressStats } from '../lib/aggregate'

type Status = 'idle' | 'loading' | 'loaded' | 'error' | 'invalid'

export function useAddressTracker() {
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [stats, setStats] = useState<AddressStats | null>(null)
  const [chains, setChains] = useState<Map<number, RelayChain>>(new Map())
  const [partial, setPartial] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const lookup = useCallback((rawAddress: string) => {
    const trimmed = rawAddress.trim()
    abortRef.current?.abort()

    if (!trimmed) {
      setStatus('idle')
      setStats(null)
      return
    }
    if (!isValidAddress(trimmed)) {
      setStatus('invalid')
      setStats(null)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setStatus('loading')
    setError(null)

    Promise.all([fetchChains(), fetchAllRequests(trimmed, controller.signal)])
      .then(([chainMap, result]) => {
        if (controller.signal.aborted) return
        setChains(chainMap)
        setPartial(result.partial)
        setStats(computeStats(result.requests, chainMap))
        setStatus('loaded')
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setStatus('error')
      })
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { address, setAddress, status, stats, chains, partial, error, lookup }
}
