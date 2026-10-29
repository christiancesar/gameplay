import type { LucideIcon } from 'lucide-react'

type HomeFeatureProps = {
  icon: LucideIcon
  title: string
  description: string
}

function HomeFeature({ icon: Icon, title, description }: HomeFeatureProps) {
  return (
    <div className="border-border/70 rounded-xl border p-3.5">
      <Icon className="text-emerald-600 dark:text-emerald-400 size-4" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
    </div>
  )
}

export { HomeFeature }
export type { HomeFeatureProps }
