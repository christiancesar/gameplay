import { cn } from 'cn'

import gameplayLogo from '@/shared/assets/brand/gameplay.png'
import gameplayUnlimitedLogo from '@/shared/assets/brand/gameplay-unlimited.png'

const LOGOS = {
  default: gameplayLogo,
  unlimited: gameplayUnlimitedLogo,
} as const

type BrandLogoProps = {
  variant?: keyof typeof LOGOS
  className?: string
}

// Os PNGs da marca são brancos com fundo transparente; no tema claro a imagem é invertida.
function BrandLogo({ variant = 'default', className }: BrandLogoProps) {
  return (
    <img
      src={LOGOS[variant]}
      alt={variant === 'unlimited' ? 'Gameplay Unlimited' : 'Gameplay'}
      className={cn('h-auto select-none invert dark:invert-0', className)}
      draggable={false}
    />
  )
}

export { BrandLogo }
export type { BrandLogoProps }
