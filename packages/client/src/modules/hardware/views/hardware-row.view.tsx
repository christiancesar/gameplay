import { cn } from 'cn'
import type { ReactNode } from 'react'

function HardwareRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-3 px-3 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('min-w-0 text-right break-words')}>
        {children}
        {hint && <span className="text-muted-foreground block text-[11px] leading-snug">{hint}</span>}
      </dd>
    </div>
  )
}

export { HardwareRow }
