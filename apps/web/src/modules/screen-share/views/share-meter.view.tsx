import { cn } from 'cn'

import { Progress } from '@/shared/ui/progress'

function ShareMeter({ label, value }: { label: string; value: number }) {
  const percent = Math.min(100, Math.round(value * 100))
  // Mesma tolerância visual para cada medida: 95% do alvo já conta como no alvo.
  const below = percent < 95
  return (
    <div className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-2 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <Progress
        aria-label={label}
        value={percent}
        className={cn(
          'h-1',
          below ? '*:data-[slot=progress-indicator]:bg-amber-500' : '*:data-[slot=progress-indicator]:bg-emerald-500',
        )}
      />
      <span className="text-right font-mono tabular-nums">{percent}%</span>
    </div>
  )
}

export { ShareMeter }
