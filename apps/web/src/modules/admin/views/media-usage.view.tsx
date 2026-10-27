import { USAGE_PERIODS, type RealtimeUsage, type RealtimeUsagePeriod, type UsagePeriod } from '@gameplay/contracts'
import { cn } from 'cn'
import { useTranslation } from 'react-i18next'

import type { UsageRangeValues } from '@/modules/admin/model/usage-range.schema'
import { formatBytes } from '@/shared/ui/format-bytes'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { MediaUsageChartView } from './media-usage-chart.view'
import { UsageRangeFormView } from './usage-range-form.view'

type MediaUsageViewProps = {
  /** undefined enquanto carrega. */
  data?: RealtimeUsagePeriod
  isFetching: boolean
  period: UsagePeriod
  range: UsageRangeValues
  limits: { min: string; max: string }
  rangeError?: 'outOfRange'
  /** O mês corrente, para a franquia grátis (mensal) da Cloudflare. */
  month?: RealtimeUsage
  onPeriodChange: (period: UsagePeriod) => void
  onApplyRange: (range: UsageRangeValues) => void
}

const BYTES_PER_GB = 1_000_000_000

/** Consumo do período escolhido: SFU e TURN cobrados pela Cloudflare, no gráfico e no total. */
function MediaUsageView({
  data,
  isFetching,
  period,
  range,
  limits,
  rangeError,
  month,
  onPeriodChange,
  onApplyRange,
}: MediaUsageViewProps) {
  const { t, i18n } = useTranslation()
  const bytes = (value: number | null | undefined) =>
    value === null || value === undefined ? '–' : formatBytes(value, i18n.language)
  const total =
    data && (data.sfu.cloudflareBytes !== null || data.turn.cloudflareBytes !== null)
      ? (data.sfu.cloudflareBytes ?? 0) + (data.turn.cloudflareBytes ?? 0)
      : null
  const monthTotal = month ? (month.sfu.cloudflareBytes ?? 0) + (month.turn.cloudflareBytes ?? 0) : 0
  const cloudflare = data?.cloudflare

  return (
    <section className="bg-card flex flex-col rounded-md border" aria-labelledby="media-usage-title">
      <header className="flex flex-wrap items-start gap-3 border-b p-4">
        <div className="min-w-0 flex-1">
          <h2 id="media-usage-title" className="text-sm font-medium">
            {t('admin.media.usage.title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">{t('admin.media.usage.description')}</p>
        </div>
        <Select value={period} onValueChange={(value) => onPeriodChange(value as UsagePeriod)}>
          <SelectTrigger className="w-48" aria-label={t('admin.media.usage.periodLabel')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USAGE_PERIODS.map((option) => (
              <SelectItem key={option} value={option}>
                {t(`admin.media.usage.periods.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className={cn('flex flex-col gap-4 p-4', isFetching && 'opacity-60')}>
        {period === 'custom' && (
          <UsageRangeFormView
            range={range}
            limits={limits}
            rangeError={rangeError}
            isFetching={isFetching}
            onApply={onApplyRange}
          />
        )}

        <dl className="flex flex-col gap-1 text-sm">
          <dt className="text-muted-foreground text-xs">{t('admin.media.usage.total')}</dt>
          <dd className="font-medium tabular-nums">{bytes(total)}</dd>
        </dl>

        {data && data.points.length > 0 ? (
          (
            [
              ['sfuBytes', 'admin.media.resources.sfu.name', data.sfu.cloudflareBytes, 'bg-emerald-500'],
              ['turnBytes', 'admin.media.resources.turn.name', data.turn.cloudflareBytes, 'bg-amber-500'],
            ] as const
          )
            .filter(([, , value]) => value !== null)
            .map(([series, label, value, dot]) => (
              <figure key={series} className="flex flex-col gap-2">
                <figcaption className="flex items-center gap-2 text-xs">
                  <span className={cn('size-2.5 rounded-[2px]', dot)} aria-hidden />
                  <span className="text-muted-foreground">{t(label)}</span>
                  <span className="font-medium tabular-nums">{bytes(value)}</span>
                </figcaption>
                <MediaUsageChartView points={data.points} bucket={data.bucket} series={series} />
              </figure>
            ))
        ) : (
          <p className="text-muted-foreground rounded-md border border-dashed px-3 py-8 text-center text-xs">
            {t('admin.media.usage.empty')}
          </p>
        )}
      </div>

      <footer className="flex flex-col gap-1 border-t p-4 text-xs">
        {month && month.cloudflare.state !== 'not-configured' && (
          <p className="text-muted-foreground">
            {t('admin.media.usage.freeTier', {
              month: month.month,
              used: (monthTotal / BYTES_PER_GB).toLocaleString(i18n.language, { maximumFractionDigits: 1 }),
              free: month.freeTierGb,
            })}
          </p>
        )}
        {cloudflare && (
          <p className={cloudflare.state === 'failing' ? 'text-amber-500' : 'text-muted-foreground'}>
            {cloudflare.state === 'not-configured'
              ? t('admin.media.usage.notConfigured')
              : cloudflare.state === 'failing'
                ? t('admin.media.usage.failing')
                : t('admin.media.usage.checkedAt', {
                    when: cloudflare.checkedAt ? formatRelativeTime(cloudflare.checkedAt, i18n.language) : '',
                  })}
          </p>
        )}
      </footer>
    </section>
  )
}

export { MediaUsageView }
export type { MediaUsageViewProps }
