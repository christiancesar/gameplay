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

const SHARE_PRIORITIES = ['smooth', 'sharp'] as const
/** What gives way first when the connection or the machine is short: sharpness (smooth) or frame rate (sharp). */
type SharePriority = (typeof SHARE_PRIORITIES)[number]

type AudioSupport = 'supported' | 'recentMac' | 'windowUnsupported' | 'tabOnly' | 'browserUnsupported'

/** Where the browser gives screen audio. Elsewhere the switch is locked and the hint says only the microphone goes. */
const AUDIO_AVAILABLE: readonly AudioSupport[] = ['supported', 'recentMac']

type ShareSettings = {
  source: ShareSource
  resolution: ShareResolution
  fps: ShareFps
  includeAudio: boolean
}

const STREAM_MODES = ['sfu', 'mesh'] as const
/** Servidor (SFU) ou Direto (Mesh). */
type StreamModeChoice = (typeof STREAM_MODES)[number]

/** O que o servidor oferece: um modo desligado aparece travado, com o motivo. */
type StreamModeOptions = {
  sfu: { available: boolean; reason: 'disabled' | 'not-configured' | null }
  mesh: { available: boolean }
}

type ShareSetupDialogViewProps = {
  open: boolean
  settings: ShareSettings
  priority: SharePriority
  /** Calculado pelo ViewModel a partir da fonte, do browser e do sistema operacional. */
  audioSupport: AudioSupport
  saveAsDefault: boolean
  /** `update`: changing resolution and frame rate of a share already running; the source and audio are fixed. */
  mode?: 'start' | 'update'
  onOpenChange: (open: boolean) => void
  onChange: (settings: ShareSettings) => void
  onPriorityChange: (priority: SharePriority) => void
  onSaveAsDefaultChange: (value: boolean) => void
  /** Modo escolhido; só ao começar. Sem `streamModes`, a escolha não aparece. */
  streamMode?: StreamModeChoice
  streamModes?: StreamModeOptions
  onStreamModeChange?: (mode: StreamModeChoice) => void
  onStart: () => void
}

const SOURCE_ICONS = { screen: MonitorIcon, window: AppWindowIcon, tab: PanelTopIcon } as const

function ShareSetupDialogView({
  open,
  settings,
  priority,
  audioSupport,
  saveAsDefault,
  mode = 'start',
  onOpenChange,
  onChange,
  onPriorityChange,
  onSaveAsDefaultChange,
  streamMode,
  streamModes,
  onStreamModeChange,
  onStart,
}: ShareSetupDialogViewProps) {
  const { t } = useTranslation()
  const isUpdate = mode === 'update'
  const set = (patch: Partial<ShareSettings>) => onChange({ ...settings, ...patch })
  const audioAvailable = AUDIO_AVAILABLE.includes(audioSupport)
  const showModes = !isUpdate && Boolean(streamModes)
  const noMode = showModes && !streamModes?.sfu.available && !streamModes?.mesh.available

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

          <div className="flex flex-col gap-2">
            <Label id="share-priority-label">{t('share.setup.priority')}</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={priority}
              onValueChange={(value) => value && onPriorityChange(value as SharePriority)}
              aria-labelledby="share-priority-label"
              className="w-full"
            >
              {SHARE_PRIORITIES.map((value) => (
                <ToggleGroupItem key={value} value={value} className="flex-1">
                  {t(`share.setup.priorities.${value}.label`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-muted-foreground text-xs">{t(`share.setup.priorities.${priority}.hint`)}</p>
          </div>

          {!isUpdate && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="share-audio">{t('share.setup.audio')}</Label>
                <p className={cn('text-xs', audioAvailable ? 'text-muted-foreground' : 'text-amber-500')}>
                  {t(`share.setup.audioSupport.${audioSupport}`)}
                </p>
              </div>
              <Switch
                id="share-audio"
                checked={settings.includeAudio && audioAvailable}
                disabled={!audioAvailable}
                onCheckedChange={(includeAudio) => set({ includeAudio })}
              />
            </div>
          )}

          {showModes && streamModes && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{t('share.mode.label')}</legend>
              {noMode ? (
                <p className="text-amber-500 text-xs">{t('share.mode.none')}</p>
              ) : (
                <div role="radiogroup" aria-label={t('share.mode.label')} className="flex flex-col gap-2">
                  {STREAM_MODES.map((option) => {
                    const available = streamModes[option].available
                    const reason = option === 'sfu' ? streamModes.sfu.reason : 'disabled'
                    const selected = streamMode === option
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!available}
                        onClick={() => onStreamModeChange?.(option)}
                        className={cn(
                          'hover:bg-accent focus-visible:ring-ring/50 flex flex-col gap-1 rounded-lg border p-3 text-left outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-60',
                          selected && 'border-foreground bg-accent',
                        )}
                      >
                        <span className="text-sm font-medium">{t(`share.mode.${option}.name`)}</span>
                        <span className="text-muted-foreground text-xs leading-snug">
                          {t(`share.mode.${option}.description`)}
                        </span>
                        {!available && reason && (
                          <span className="text-amber-500 text-xs">{t(`share.mode.reasons.${reason}`)}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </fieldset>
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
          <Button variant="success" onClick={onStart} disabled={noMode}>
            {!isUpdate && <MonitorUpIcon data-icon="inline-start" aria-hidden />}
            {isUpdate ? t('share.setup.apply') : t('share.setup.start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SHARE_FPS, SHARE_PRIORITIES, SHARE_RESOLUTIONS, SHARE_SOURCES, STREAM_MODES, ShareSetupDialogView }
export type {
  AudioSupport,
  ShareFps,
  SharePriority,
  ShareResolution,
  ShareSettings,
  ShareSetupDialogViewProps,
  ShareSource,
  StreamModeChoice,
  StreamModeOptions,
}
