import type { RealtimeUsage } from '@gameplay/contracts'
import { cn } from 'cn'
import { useTranslation } from 'react-i18next'

import { formatRelativeTime } from '@/shared/ui/relative-time'

type MediaUsageViewProps = { usage: RealtimeUsage }

const BYTES_PER_GB = 1_000_000_000

function barTone(share: number) {
  if (share >= 1) return 'bg-red-500'
  return share >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
}

/** Consumo do mês: SFU e TURN separados e o total da Cloudflare contra a franquia grátis, que os dois dividem. */
function MediaUsageView({ usage }: MediaUsageViewProps) {
  const { t, i18n } = useTranslation()
  const gb = (bytes: number) =>
    (bytes / BYTES_PER_GB).toLocaleString(i18n.language, { maximumFractionDigits: bytes < BYTES_PER_GB ? 3 : 1 })
  const { sfu, turn, cloudflare, freeTierGb, month } = usage
  const official = sfu.cloudflareBytes !== null || turn.cloudflareBytes !== null
  const total = (sfu.cloudflareBytes ?? 0) + (turn.cloudflareBytes ?? 0)
  const share = Math.min(1, total / (freeTierGb * BYTES_PER_GB))

  return (
    <section className="flex flex-col gap-3" aria-labelledby="media-usage-title">
      <h2 id="media-usage-title" className="text-sm font-medium">
        {t('admin.media.usage.title', { month })}
      </h2>
      <dl className="bg-card grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-md border p-4 text-sm">
        <dt>{t('admin.media.resources.sfu.name')}</dt>
        <dd className="text-right tabular-nums">
          {sfu.cloudflareBytes !== null ? `${gb(sfu.cloudflareBytes)} GB` : '–'}
          <span className="text-muted-foreground block text-xs">
            {t('admin.media.usage.reported', { value: gb(sfu.reportedBytes) })}
          </span>
        </dd>
        <dt>{t('admin.media.resources.turn.name')}</dt>
        <dd className="text-right tabular-nums">
          {turn.cloudflareBytes !== null ? `${gb(turn.cloudflareBytes)} GB` : '–'}
        </dd>
        <dt className="font-medium">{t('admin.media.usage.total')}</dt>
        <dd className="text-right font-medium tabular-nums">
          {official ? t('admin.media.usage.ofFreeTier', { used: gb(total), free: freeTierGb }) : '–'}
        </dd>
        {official && (
          <div className="bg-muted col-span-2 h-1.5 overflow-hidden rounded-full" aria-hidden>
            <div className={cn('h-full', barTone(share))} style={{ width: `${share * 100}%` }} />
          </div>
        )}
      </dl>
      <p className={cn('text-xs', cloudflare.state === 'failing' ? 'text-amber-500' : 'text-muted-foreground')}>
        {cloudflare.state === 'not-configured'
          ? t('admin.media.usage.notConfigured')
          : cloudflare.state === 'failing'
            ? t('admin.media.usage.failing')
            : t('admin.media.usage.checkedAt', {
                when: cloudflare.checkedAt ? formatRelativeTime(cloudflare.checkedAt, i18n.language) : '',
              })}
      </p>
    </section>
  )
}

export { MediaUsageView }
export type { MediaUsageViewProps }
