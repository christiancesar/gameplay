import type { LanguageOption } from '@/shared/lib/language-option'
import { cn } from 'cn'

import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

type LanguageSwitcherProps = {
  value: string
  options: readonly LanguageOption[]
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

function LanguageSwitcher({ value, options, onChange, ariaLabel, className }: LanguageSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      spacing={0}
      variant="outline"
      value={value}
      // Radix devolve '' ao clicar no item já ativo; o idioma nunca fica vazio.
      onValueChange={(next) => next && onChange(next)}
      aria-label={ariaLabel}
      className={cn(className)}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className="px-3 text-xs">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export { LanguageSwitcher }
export type { LanguageOption, LanguageSwitcherProps }
