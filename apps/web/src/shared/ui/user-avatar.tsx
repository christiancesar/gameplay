import { cn } from 'cn'

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { initialsOf } from '@/shared/ui/initials'

type UserAvatarProps = {
  name: string
  imageUrl?: string
  size?: 'sm' | 'default' | 'lg' | 'xl'
  className?: string
}

const SIZE_CLASS = {
  sm: 'size-6 text-[10px]',
  default: 'size-8 text-xs',
  lg: 'size-10 text-sm',
  xl: 'size-12 text-base',
} as const

function UserAvatar({ name, imageUrl, size = 'default', className }: UserAvatarProps) {
  return (
    <Avatar className={cn(SIZE_CLASS[size], className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
      <AvatarFallback className="bg-muted text-foreground font-medium">{initialsOf(name)}</AvatarFallback>
    </Avatar>
  )
}

export { UserAvatar }
export type { UserAvatarProps }
