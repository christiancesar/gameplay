import { cn } from 'cn'
import { Loader2Icon, MonitorUpIcon, SquareIcon, TriangleAlertIcon, UsersIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'

const SHARE_PRESETS = ['720p30', '720p60', '1080p30', '1080p60'] as const
type SharePreset = (typeof SHARE_PRESETS)[number]

type ShareStats = {
  uploadKbps: number
  bandwidthKbps: number
  fps: number
  width: number
  height: number
}

type SharePanelState =
  | { status: 'idle' }
  | { status: 'configuring'; preset: SharePreset; includeAudio: boolean }
  | { status: 'picking' }
  | { status: 'live'; preset: SharePreset; stats: ShareStats; viewers: number; degraded: boolean }

type SharePanelViewProps = {
  state: SharePanelState
  onStart: () => void
  onPresetChange: (preset: SharePreset) => void
  onIncludeAudioChange: (includeAudio: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  onStop: () => void
}

function formatKbps(kbps: number) {
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${Math.round(kbps)} kbps`
}

function SharePanelView({ state, onStart, onPresetChange, onIncludeAudioChange, onConfirm, onCancel, onStop }: SharePanelViewProps) {
  const { t } = useTranslation()

  if (state.status === 'idle') {
    return (
      <Button variant="success" className="h-14 w-full" onClick={onStart} aria-label={t('share.start')}>
        <MonitorUpIcon className="size-5" aria-hidden />
      </Button>
    )
  }

  if (state.status === 'picking') {
    return (
      <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-md p-3 text-xs" role="status">
        <Loader2Icon className="size-4 shrink-0 animate-spin" aria-hidden />
        {t('share.waitingPicker')}
      </div>
    )
  }

  if (state.status === 'configuring') {
    return (
      <div className="bg-muted flex flex-col gap-3 rounded-md p-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="share-preset">{t('share.quality')}</Label>
          <Select value={state.preset} onValueChange={(value) => onPresetChange(value as SharePreset)}>
            <SelectTrigger id="share-preset" size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHARE_PRESETS.map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {preset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="share-audio">{t('share.includeAudio')}</Label>
            <p className="text-muted-foreground text-[11px] leading-snug">{t('share.includeAudioHint')}</p>
          </div>
          <Switch id="share-audio" checked={state.includeAudio} onCheckedChange={onIncludeAudioChange} />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button variant="success" size="sm" className="flex-1" onClick={onConfirm}>
            <MonitorUpIcon data-icon="inline-start" aria-hidden />
            {t('share.choose')}
          </Button>
        </div>
      </div>
    )
  }

  const { stats, viewers, degraded, preset } = state
  const items = [
    { label: t('share.stats.upload'), value: formatKbps(stats.uploadKbps) },
    { label: t('share.stats.bandwidth'), value: formatKbps(stats.bandwidthKbps) },
    { label: t('share.stats.fps'), value: String(Math.round(stats.fps)) },
    { label: t('share.stats.resolution'), value: `${stats.width}×${stats.height}` },
  ]

  return (
    <div className={cn('flex flex-col gap-2 rounded-md border p-3', degraded ? 'border-amber-500/60' : 'border-emerald-600/60')}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-red-500">
          <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden />
          {t('share.live')} · {preset}
        </span>
        <span className="text-muted-foreground flex items-center gap-1">
          <UsersIcon className="size-3.5" aria-hidden />
          {t('share.viewers', { count: viewers })}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <dt className="text-muted-foreground text-[11px]">{item.label}</dt>
            <dd className="font-mono text-xs whitespace-nowrap tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      {degraded && (
        <p role="alert" className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-500">
          <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
          {t('share.degraded', { preset })}
        </p>
      )}
      <Button variant="danger" size="sm" onClick={onStop}>
        <SquareIcon data-icon="inline-start" aria-hidden />
        {t('share.stop')}
      </Button>
    </div>
  )
}

export { SHARE_PRESETS, SharePanelView }
export type { SharePanelState, SharePanelViewProps, SharePreset, ShareStats }
