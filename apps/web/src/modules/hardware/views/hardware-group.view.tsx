import type { ComponentType, ReactNode } from 'react'

function HardwareGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <Icon className="size-3.5" />
        {title}
      </h3>
      <dl className="divide-y rounded-md border text-[13px]">{children}</dl>
    </section>
  )
}

export { HardwareGroup }
