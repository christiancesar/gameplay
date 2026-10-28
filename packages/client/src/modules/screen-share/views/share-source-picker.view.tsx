import { cn } from 'cn'
import { AppWindowIcon, MonitorIcon, RefreshCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'

/** Uma tela ou janela que o app lista, com miniatura. */
type ShareSourceOption = {
  id: string
  name: string
  kind: 'screen' | 'window'
  /** Data URL de uma miniatura pequena; sem ela, o cartão mostra o ícone do tipo. */
  thumbnail: string | null
  /** Ícone do aplicativo, só nas janelas. */
  appIcon: string | null
}

type ShareSourcePickerViewProps = {
  sources: readonly ShareSourceOption[]
  kind: 'screen' | 'window'
  selectedId: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
}

/** O seletor de telas e janelas do diálogo de compartilhar, para o host que as lista (Windows e X11). */
function ShareSourcePickerView({ sources, kind, selectedId, onSelect, onRefresh }: ShareSourcePickerViewProps) {
  const { t } = useTranslation()
  const visible = sources.filter((source) => source.kind === kind)

  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-medium">{t(`share.setup.sourcePicker.${kind}`)}</legend>
        <Button type="button" variant="ghost" size="xs" onClick={onRefresh}>
          <RefreshCwIcon data-icon="inline-start" aria-hidden />
          {t('share.setup.sourcePicker.refresh')}
        </Button>
      </div>
      {visible.length === 0 ? (
        <p className="text-muted-foreground text-xs">{t('share.setup.sourcePicker.empty')}</p>
      ) : (
        <div
          role="radiogroup"
          aria-label={t(`share.setup.sourcePicker.${kind}`)}
          className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1"
        >
          {visible.map((source) => {
            const selected = source.id === selectedId
            const KindIcon = source.kind === 'screen' ? MonitorIcon : AppWindowIcon
            return (
              <button
                key={source.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(source.id)}
                className={cn(
                  'hover:bg-accent focus-visible:ring-ring/50 flex flex-col gap-2 rounded-lg border p-2 text-left outline-none focus-visible:ring-3',
                  selected && 'border-foreground bg-accent',
                )}
              >
                <span className="bg-muted flex aspect-video items-center justify-center overflow-hidden rounded-md">
                  {source.thumbnail ? (
                    <img src={source.thumbnail} alt="" className="size-full object-contain" />
                  ) : (
                    <KindIcon className="text-muted-foreground size-8" aria-hidden />
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  {source.appIcon ? (
                    <img src={source.appIcon} alt="" className="size-4 shrink-0" />
                  ) : (
                    <KindIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  )}
                  <span className="truncate text-xs font-medium">{source.name}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}

export { ShareSourcePickerView }
export type { ShareSourceOption, ShareSourcePickerViewProps }
