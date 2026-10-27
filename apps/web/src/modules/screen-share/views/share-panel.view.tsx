import { cn } from 'cn'
import {
  ChartNoAxesColumnIcon,
  Loader2Icon,
  MonitorUpIcon,
  SlidersHorizontalIcon,
  SquareIcon,
  TriangleAlertIcon,
  UsersIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ui/button'
import { formatKbps } from '@/shared/ui/format-kbps'

import type { ShareFps, ShareResolution, ShareSource } from './share-setup-dialog.view'
import { ShareMeter } from './share-meter.view'

type StreamQuality = { width: number; height: number; fps: number; kbps: number }

/** Vem do `qualityLimitationReason` das estatísticas do WebRTC. */
type QualityLimitation = 'none' | 'bandwidth' | 'cpu' | 'other'

/** `missing`: o áudio foi pedido e o browser não entregou. `silent` e `active`: há faixa, sem som ou com som agora. */
type ShareAudioState = 'off' | 'missing' | 'silent' | 'active'

const AUDIO_TONE: Record<ShareAudioState, string> = {
  off: 'text-muted-foreground',
  missing: 'text-amber-500',
  silent: 'text-muted-foreground',
  active: 'text-emerald-500',
}

type SharePanelState =
  | { status: 'idle' }
  | { status: 'picking' }
  | {
      status: 'live'
      source: ShareSource
      target: { resolution: ShareResolution; fps: ShareFps }
      /** Pior qualidade entre os espectadores; ausente enquanto ninguém assiste. */
      delivering?: StreamQuality
      isOnTarget: boolean
      limitation: QualityLimitation
      viewerCount: number
      audio: ShareAudioState
      /** Servidor (SFU): `delivering` é o que sobe para o servidor. Direto (Mesh): o pior espectador. */
      mode: 'sfu' | 'mesh'
    }

type SharePanelViewProps = {
  state: SharePanelState
  onStart: () => void
  onStop: () => void
  onOpenDetails: () => void
  /** Opens the dialog to change resolution and frame rate while live. Hidden when missing. */
  onChangeQuality?: () => void
}

const TARGET_HEIGHT = { '720p': 720, '1080p': 1080 } as const

function SharePanelView({ state, onStart, onStop, onOpenDetails, onChangeQuality }: SharePanelViewProps) {
  const { t } = useTranslation()

  if (state.status === 'idle') {
    return (
      <Button
        variant="success"
        className="phone-landscape:h-10 h-14 w-full"
        onClick={onStart}
        aria-label={t('share.start')}
      >
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

  const { source, target, delivering, isOnTarget, limitation, viewerCount, audio, mode } = state
  const below = Boolean(delivering) && !isOnTarget
  const targetHeight = TARGET_HEIGHT[target.resolution]

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-md border p-3',
        below ? 'border-amber-500/60' : 'border-emerald-600/60',
      )}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-red-500">
          <span className="size-2 animate-pulse rounded-full bg-red-500" aria-hidden />
          {t('share.live')}
          <span className="text-muted-foreground font-normal">· {t(`share.setup.sources.${source}.label`)}</span>
          <span className="text-muted-foreground rounded border px-1 font-normal">{t(`share.mode.${mode}.name`)}</span>
        </span>
        <span className="text-muted-foreground flex items-center gap-1">
          <UsersIcon className="size-3.5" aria-hidden />
          {t('share.viewers', { count: viewerCount })}
        </span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-muted-foreground">{t('share.monitor.target')}</dt>
        <dd className="text-right font-mono tabular-nums">
          {target.resolution} · {target.fps} fps
        </dd>
        <dt className="text-muted-foreground">{mode === 'sfu' ? t('share.uplink') : t('share.monitor.delivering')}</dt>
        <dd
          className={cn(
            'text-right font-mono tabular-nums',
            below ? 'text-amber-500' : delivering && 'text-emerald-500',
          )}
        >
          {delivering ? `${delivering.height}p · ${Math.round(delivering.fps)} fps` : '–'}
        </dd>
        <dt className="text-muted-foreground">{t('share.monitor.audio')}</dt>
        <dd className={cn('flex items-center justify-end gap-1', AUDIO_TONE[audio])}>
          {audio === 'missing' && <TriangleAlertIcon className="size-3.5" aria-hidden />}
          {t(`share.monitor.audioStates.${audio}`)}
        </dd>
      </dl>

      {delivering ? (
        <div className="flex flex-col gap-1.5">
          <ShareMeter label={t('share.setup.resolution')} value={delivering.height / targetHeight} />
          <ShareMeter label="FPS" value={delivering.fps / target.fps} />
          <p className="grid grid-cols-[4.5rem_1fr] gap-2 text-[11px]">
            <span className="text-muted-foreground">{t('share.stats.upload')}</span>
            <span className="text-right font-mono tabular-nums">{formatKbps(delivering.kbps)}</span>
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-[11px] leading-snug">{t('share.monitor.noViewers')}</p>
      )}

      {below && limitation !== 'none' && (
        <p role="alert" className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-500">
          <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">{t(`share.monitor.limitedBy.${limitation}`)}.</span>{' '}
            {limitation !== 'other' && t(`share.monitor.tips.${limitation}`)}
          </span>
        </p>
      )}

      {onChangeQuality && (
        <Button variant="ghost" size="sm" onClick={onChangeQuality}>
          <SlidersHorizontalIcon data-icon="inline-start" aria-hidden />
          {t('share.changeQuality')}
        </Button>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onOpenDetails} disabled={viewerCount === 0}>
          <ChartNoAxesColumnIcon data-icon="inline-start" aria-hidden />
          {t('share.monitor.details')}
        </Button>
        <Button variant="danger" size="sm" className="flex-1" onClick={onStop} aria-label={t('share.stop')}>
          <SquareIcon data-icon="inline-start" aria-hidden />
          {t('share.stopShort')}
        </Button>
      </div>
    </div>
  )
}

export { SharePanelView }
export type { QualityLimitation, ShareAudioState, SharePanelState, SharePanelViewProps, StreamQuality }
