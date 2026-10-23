import { cn } from 'cn'
import type { ComponentType, ReactNode } from 'react'

type SectionLabelProps = {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  count?: number
  /** Ação curta alinhada à direita (ex.: "Limpar tudo"). */
  action?: ReactNode
  id?: string
  className?: string
}

/** Cabeçalho discreto de seção: ícone, texto em caixa alta e contador opcional. */
function SectionLabel({ icon: Icon, children, count, action, id, className }: SectionLabelProps) {
  return (
    <header className={cn('flex min-h-6 w-full items-center justify-between gap-2 px-1', className)}>
      <h2 id={id} className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <Icon className="size-3.5" aria-hidden />
        {children}
        {count !== undefined && count > 0 && (
          <span className="bg-muted text-foreground rounded-full px-1.5 text-[10px] tabular-nums">{count}</span>
        )}
      </h2>
      {action}
    </header>
  )
}

export { SectionLabel }
