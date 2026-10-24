import { cn } from 'cn'

import { initialsOf } from '@/shared/ui/initials'

type ServerIconProps = {
  name: string
  imageUrl?: string
  className?: string
}

function ServerIcon({ name, imageUrl, className }: ServerIconProps) {
  return (
    <span
      className={cn(
        'bg-muted text-foreground ring-border inline-flex size-6 shrink-0 ring-1 ring-inset items-center justify-center overflow-hidden rounded-sm text-[10px] font-semibold',
        className,
      )}
    >
      {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : initialsOf(name)}
    </span>
  )
}

export { ServerIcon }
export type { ServerIconProps }
