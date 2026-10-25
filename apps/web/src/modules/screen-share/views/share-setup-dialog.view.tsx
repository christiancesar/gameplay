import { cn } from 'cn'
import { AppWindowIcon, Gamepad2Icon, InfoIcon, MonitorIcon, MonitorUpIcon, PanelTopIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

const SHARE_SOURCES = ['screen', 'window', 'tab'] as const
/** Tipo de fonte. Vira a dica `displaySurface` do getDisplayMedia; a escolha exata acontece no seletor do browser. */
type ShareSource = (typeof SHARE_SOURCES)[number]

const SHARE_RESOLUTIONS = ['720p', '1080p'] as const
type ShareResolution = (typeof SHARE_RESOLUTIONS)[number]

const SHARE_FPS = [30, 60] as const
type ShareFps = (typeof SHARE_FPS)[number]

type AudioSupport = 'supported' | 'windowsOnly' | 'unsupported'

type ShareSettings = {
  source: ShareSource
  resolution: ShareResolution
  fps: ShareFps
  includeAudio: boolean
}

type ShareSetupDialogViewProps = {
  open: boolean
  settings: ShareSettings
  /** Calculado pelo ViewModel a partir da fonte e do sistema operacional. */
  audioSupport: AudioSupport
  saveAsDefault: boolean
  /** `update`: changing resolution and frame rate of a share already running; the source and audio are fixed. */
  mode?: 'start' | 'update'
  onOpenChange: (open: boolean) => void
  onChange: (settings: ShareSettings) => void
  onSaveAsDefaultChange: (value: boolean) => void
  onStart: () => void
}

const SOURCE_ICONS = { screen: MonitorIcon, window: AppWindowIcon, tab: PanelTopIcon } as const

function ShareSetupDialogView({
  open,
  settings,
  audioSupport,
  saveAsDefault,
  mode = 'start',
  onOpenChange,
  onChange,
  onSaveAsDefaultChange,
  onStart,
}: ShareSetupDialogViewProps) {
  const { t } = useTranslation()
  const isUpdate = mode === 'update'
  const set = (patch: Partial<ShareSettings>) => onChange({ ...settings, ...patch })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isUpdate ? t('share.setup.updateTitle') : t('share.setup.title')}</DialogTitle>
          <DialogDescription>
            {isUpdate ? t('share.setup.updateDescription') : t('share.setup.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {!isUpdate && (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-sm font-medium">{t('share.setup.source')}</legend>
              <div role="radiogroup" aria-label={t('share.setup.source')} className="grid grid-cols-3 gap-2">
                {SHARE_SOURCES.map((source) => {
                  const Icon = SOURCE_ICONS[source]
                  const selected = settings.source === source
                  return (
                    <button
                      key={source}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => set({ source })}
                      className={cn(
                        'hover:bg-accent focus-visible:ring-ring/50 flex flex-col items-center gap-2 rounded-lg border p-3 text-center outline-none focus-visible:ring-3',
                        selected && 'border-foreground bg-accent',
                      )}
                    >
                      <span className="flex items-center gap-1.5" aria-hidden>
                        <Icon className="size-6" />
                        {source === 'window' && (
                          <>
                            <span className="text-muted-foreground text-sm">/</span>
                            <Gamepad2Icon className="size-6" />
                          </>
                        )}
                      </span>
                      <span className="text-sm font-medium">{t(`share.setup.sources.${source}.label`)}</span>
                      <span className="text-muted-foreground text-[11px] leading-snug">
                        {t(`share.setup.sources.${source}.hint`)}
                      </span>
                    </button>
                  )
                })}
              </div>
              {settings.source === 'window' && (
                <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                  <InfoIcon className="mt-px size-3.5 shrink-0" aria-hidden />
                  {t('share.setup.gameTip')}
                </p>
              )}
            </fieldset>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label id="share-resolution-label">{t('share.setup.resolution')}</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={settings.resolution}
                onValueChange={(value) => value && set({ resolution: value as ShareResolution })}
                aria-labelledby="share-resolution-label"
                className="w-full"
              >
                {SHARE_RESOLUTIONS.map((value) => (
                  <ToggleGroupItem key={value} value={value} className="flex-1">
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="flex flex-col gap-2">
              <Label id="share-fps-label">{t('share.setup.fps')}</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                value={String(settings.fps)}
                onValueChange={(value) => value && set({ fps: Number(value) as ShareFps })}
                aria-labelledby="share-fps-label"
                className="w-full"
              >
                {SHARE_FPS.map((value) => (
                  <ToggleGroupItem key={value} value={String(value)} className="flex-1">
                    {value} fps
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {!isUpdate && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="share-audio">{t('share.setup.audio')}</Label>
                <p
                  className={cn('text-xs', audioSupport === 'unsupported' ? 'text-amber-500' : 'text-muted-foreground')}
                >
                  {t(`share.setup.audioSupport.${audioSupport}`)}
                </p>
              </div>
              <Switch
                id="share-audio"
                checked={settings.includeAudio && audioSupport !== 'unsupported'}
                disabled={audioSupport === 'unsupported'}
                onCheckedChange={(includeAudio) => set({ includeAudio })}
              />
            </div>
          )}

          {!isUpdate && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="share-default"
                checked={saveAsDefault}
                onCheckedChange={(value) => onSaveAsDefaultChange(value === true)}
              />
              <Label htmlFor="share-default" className="font-normal">
                {t('share.setup.saveAsDefault')}
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="success" onClick={onStart}>
            {!isUpdate && <MonitorUpIcon data-icon="inline-start" aria-hidden />}
            {isUpdate ? t('share.setup.apply') : t('share.setup.start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SHARE_FPS, SHARE_RESOLUTIONS, SHARE_SOURCES, ShareSetupDialogView }
export type { AudioSupport, ShareFps, ShareResolution, ShareSettings, ShareSetupDialogViewProps, ShareSource }
