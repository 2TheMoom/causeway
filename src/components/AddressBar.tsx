import { useState, type FormEvent } from 'react'

interface Props {
  onSubmit: (address: string) => void
  initialValue?: string
  isInvalid?: boolean
}

const EXAMPLE_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

export function AddressBar({ onSubmit, initialValue = '', isInvalid }: Props) {
  const [value, setValue] = useState(initialValue)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="flex items-center gap-2 rounded-2xl border p-1.5 shadow-[var(--shadow-card)] transition-colors focus-within:border-[var(--series-1)]"
        style={{ borderColor: isInvalid ? 'var(--status-critical)' : 'var(--border)', background: 'var(--surface-1)' }}
      >
        <svg
          className="ml-2.5 shrink-0"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a wallet address — 0x…"
          spellCheck={false}
          autoComplete="off"
          className="font-mono-tabular min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:font-sans"
          style={{ color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: 'var(--series-1)' }}
        >
          Track
        </button>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 px-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        {isInvalid ? (
          <span style={{ color: 'var(--status-critical)' }}>That doesn't look like a valid EVM address.</span>
        ) : (
          <>
            <span>Try</span>
            <button
              type="button"
              onClick={() => {
                setValue(EXAMPLE_ADDRESS)
                onSubmit(EXAMPLE_ADDRESS)
              }}
              className="underline decoration-dotted underline-offset-2 hover:text-[var(--series-1)]"
            >
              vitalik.eth
            </button>
          </>
        )}
      </div>
    </form>
  )
}
