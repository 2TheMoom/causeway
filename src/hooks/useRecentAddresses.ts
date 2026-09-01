import { useCallback, useState } from 'react'

const KEY = 'causeway-recent-addresses'
const MAX = 5

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function useRecentAddresses() {
  const [recent, setRecent] = useState<string[]>(read)

  const remember = useCallback((address: string) => {
    setRecent((prev) => {
      const next = [address, ...prev.filter((a) => a.toLowerCase() !== address.toLowerCase())].slice(0, MAX)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        // storage unavailable (private mode, quota) — recents just won't persist
      }
      return next
    })
  }, [])

  return { recent, remember }
}
