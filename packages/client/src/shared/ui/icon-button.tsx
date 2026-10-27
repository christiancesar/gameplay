import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/shared/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'children' | 'aria-label'> & {
  /** Texto do tooltip e nome acessível do botão. */
  label: string
  icon: ReactNode
  /** Conteúdo extra sobreposto ao ícone, como um contador. */
  badge?: ReactNode
}

function IconButton({ label, icon, badge, variant = 'ghost', size = 'icon', className, ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size={size} aria-label={label} className={className} {...props}>
          <span className="relative inline-flex">
            {icon}
            {badge}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export { IconButton }
export type { IconButtonProps }
