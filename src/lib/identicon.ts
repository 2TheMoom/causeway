function fnv1a(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export interface IdenticonSpec {
  hueA: number
  hueB: number
  angle: number
}

/** Deterministic two-tone gradient derived from the address — no external avatar service. */
export function identiconFor(address: string): IdenticonSpec {
  const hash = fnv1a(address.toLowerCase())
  const hueA = hash % 360
  const hueB = (hueA + 80 + (Math.floor(hash / 360) % 120)) % 360
  const angle = Math.floor(hash / 100000) % 360
  return { hueA, hueB, angle }
}
