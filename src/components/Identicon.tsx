import { useId } from 'react'
import { identiconFor } from '../lib/identicon'

interface Props {
  address: string
  size?: number
}

export function Identicon({ address, size = 28 }: Props) {
  const { hueA, hueB, angle } = identiconFor(address)
  const gradientId = useId()

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className="shrink-0 rounded-full" aria-hidden>
      <defs>
        <linearGradient id={gradientId} gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={`hsl(${hueA} 75% 58%)`} />
          <stop offset="100%" stopColor={`hsl(${hueB} 70% 48%)`} />
        </linearGradient>
      </defs>
      <circle cx="14" cy="14" r="14" fill={`url(#${gradientId})`} />
    </svg>
  )
}
