import { cn } from 'cn'
import type { ComponentType, ReactNode } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

type DialogSection<Id extends string> = {
  id: Id
  label: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  badge?: number
  /** Seção destrutiva: texto vermelho e posicionada no fim da navegação. */
  danger?: boolean
}

type SectionDialogProps<Id extends string> = {
  open: boolean
  title: string
  subtitle: string
  sections: readonly DialogSection<Id>[]
  current: Id
  children: ReactNode
  onOpenChange: (open: boolean) => void
  onSectionChange: (section: Id) => void
}

/** Modal com navegação lateral (vira abas no topo em telas estreitas). */
function SectionDialog<Id extends string>({
  open,
  title,
  subtitle,
  sections,
  current,
  children,
  onOpenChange,
  onSectionChange,
}: SectionDialogProps<Id>) {
  const currentSection = sections.find((section) => section.id === current)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(40rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl md:flex-row"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <nav aria-label={subtitle} className="bg-muted/40 flex shrink-0 gap-1 overflow-x-auto border-b p-2 md:w-52 md:flex-col md:border-r md:border-b-0 md:p-3">
          <DialogHeader className="hidden px-2 pt-1 pb-3 md:flex">
            <DialogTitle className="truncate">{title}</DialogTitle>
            <DialogDescription>{subtitle}</DialogDescription>
          </DialogHeader>
          {sections.map(({ id, label, icon: Icon, badge, danger }) => (
            <button
              key={id}
              type="button"
              aria-current={id === current ? 'page' : undefined}
              onClick={() => onSectionChange(id)}
              className={cn(
                'hover:bg-accent focus-visible:ring-ring/50 flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm outline-none focus-visible:ring-3',
                id === current && 'bg-accent font-medium',
                danger && 'text-destructive md:mt-auto',
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <section className="min-h-0 flex-1 overflow-y-auto p-6">
          <h2 className="mb-5 text-lg font-medium">{currentSection?.label}</h2>
          {children}
        </section>
      </DialogContent>
    </Dialog>
  )
}

export { SectionDialog }
export type { DialogSection, SectionDialogProps }
