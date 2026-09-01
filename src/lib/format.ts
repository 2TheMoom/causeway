export function formatUsdCompact(value: number): string {
  if (value === 0) return '$0'
  const abs = Math.abs(value)
  if (abs < 1000) return `$${value.toFixed(abs < 10 ? 2 : 0)}`
  const units: [number, string][] = [
    [1_000_000_000, 'B'],
    [1_000_000, 'M'],
    [1_000, 'K'],
  ]
  for (const [threshold, suffix] of units) {
    if (abs >= threshold) return `$${(value / threshold).toFixed(2)}${suffix}`
  }
  return `$${value.toFixed(2)}`
}

export function formatUsdFull(value: number): string {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value)
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`
}

const RELATIVE_UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [31_536_000, 'year'],
  [2_592_000, 'month'],
  [604_800, 'week'],
  [86_400, 'day'],
  [3_600, 'hour'],
  [60, 'minute'],
  [1, 'second'],
]

export function formatRelativeTime(iso: string): string {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [secondsInUnit, unit] of RELATIVE_UNITS) {
    if (Math.abs(diffSec) >= secondsInUnit || unit === 'second') {
      return rtf.format(-Math.round(diffSec / secondsInUnit), unit)
    }
  }
  return rtf.format(0, 'second')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
