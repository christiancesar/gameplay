import type { RealtimeUsagePeriod, UsageBucket } from '@gameplay/contracts'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/ui/chart'
import { formatBytes } from '@/shared/ui/format-bytes'

type MediaUsageChartViewProps = { points: RealtimeUsagePeriod['points']; bucket: UsageBucket }

const SERIES = ['sfuBytes', 'turnBytes'] as const

const TICK_FORMAT: Record<UsageBucket, Intl.DateTimeFormatOptions> = {
  minute: { hour: '2-digit', minute: '2-digit' },
  'five-minutes': { hour: '2-digit', minute: '2-digit' },
  'fifteen-minutes': { hour: '2-digit', minute: '2-digit' },
  hour: { day: '2-digit', month: 'short', hour: '2-digit' },
  day: { day: '2-digit', month: 'short' },
}

/** SFU (verde) e TURN (âmbar) cobrados pela Cloudflare em cada intervalo do período, empilhados: o topo é o total. */
function MediaUsageChartView({ points, bucket }: MediaUsageChartViewProps) {
  const { t, i18n } = useTranslation()
  const config = {
    sfuBytes: { label: t('admin.media.resources.sfu.name'), color: 'var(--color-emerald-500)' },
    turnBytes: { label: t('admin.media.resources.turn.name'), color: 'var(--color-amber-500)' },
  } satisfies ChartConfig
  const series = SERIES.filter((key) => points.some((point) => point[key] !== null))
  const time = (at: string, options: Intl.DateTimeFormatOptions) => new Date(at).toLocaleString(i18n.language, options)

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <AreaChart data={points} margin={{ left: 12, right: 12 }}>
        <defs>
          {series.map((key) => (
            <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
              <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="at"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(at: string) => time(at, TICK_FORMAT[bucket])}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, payload) =>
                time(String(payload[0]?.payload?.at ?? ''), { dateStyle: 'medium', timeStyle: 'short' })
              }
              formatter={(value, name) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ background: `var(--color-${String(name)})` }}
                  />
                  <span className="text-muted-foreground">{config[name as keyof typeof config]?.label}</span>
                  <span className="ml-auto font-mono font-medium tabular-nums">
                    {formatBytes(Number(value), i18n.language)}
                  </span>
                </div>
              )}
            />
          }
        />
        {series.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stackId="egress"
            fill={`url(#fill-${key})`}
            stroke={`var(--color-${key})`}
            isAnimationActive={false}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}

export { MediaUsageChartView }
export type { MediaUsageChartViewProps }
