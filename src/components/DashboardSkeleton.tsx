export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Loading address activity">
      <div className="flex items-center justify-between px-1">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-3 w-40" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-3 h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="skeleton h-[220px] rounded-2xl" />
        <div className="skeleton h-[220px] rounded-2xl" />
      </div>

      <div className="skeleton h-[280px] rounded-2xl" />
      <div className="skeleton h-[320px] rounded-2xl" />
    </div>
  )
}
