import { cn } from 'cn'

import { assetUrl } from '@/shared/lib/asset-url'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { initialsOf } from '@/shared/ui/initials'

type UserAvatarProps = {
  name: string
  imageUrl?: string
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl'
  className?: string
}

const SIZE_CLASS = {
  xs: 'size-5',
  sm: 'size-6',
  default: 'size-8',
  lg: 'size-10',
  xl: 'size-12',
  '2xl': 'size-20',
} as const

// The shadcn fallback sets its own text-sm, so the initials size goes on the fallback, not the root.
const TEXT_CLASS = {
  xs: 'text-[8px]',
  sm: 'text-[10px]',
  default: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
  '2xl': 'text-xl',
} as const

function UserAvatar({ name, imageUrl, size = 'default', className }: UserAvatarProps) {
  return (
    <Avatar className={cn(SIZE_CLASS[size], className)}>
      {imageUrl && <AvatarImage src={assetUrl(imageUrl)} alt={name} />}
      <AvatarFallback className={cn('bg-muted text-foreground font-medium', TEXT_CLASS[size])}>
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  )
}

export { UserAvatar }
export type { UserAvatarProps }
