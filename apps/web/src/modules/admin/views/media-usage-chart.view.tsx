import type { RealtimeUsagePeriod, UsageBucket } from '@gameplay/contracts'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/ui/chart'
import { formatBytes } from '@/shared/ui/format-bytes'

type UsageSeries = 'sfuBytes' | 'turnBytes'

type MediaUsageChartViewProps = {
  points: RealtimeUsagePeriod['points']
  bucket: UsageBucket
  series: UsageSeries
}

const COLORS: Record<UsageSeries, string> = {
  sfuBytes: 'var(--color-emerald-500)',
  turnBytes: 'var(--color-amber-500)',
}
const LABELS = { sfuBytes: 'admin.media.resources.sfu.name', turnBytes: 'admin.media.resources.turn.name' } as const

const TICK_FORMAT: Record<UsageBucket, Intl.DateTimeFormatOptions> = {
  minute: { hour: '2-digit', minute: '2-digit' },
  'five-minutes': { hour: '2-digit', minute: '2-digit' },
  'fifteen-minutes': { hour: '2-digit', minute: '2-digit' },
  hour: { day: '2-digit', month: 'short', hour: '2-digit' },
  day: { day: '2-digit', month: 'short' },
}

/**
 * O que a Cloudflare cobrou de um recurso (SFU ou TURN) em cada intervalo do período. Cada recurso tem o
 * próprio gráfico e a própria escala: num eixo só, os MB do TURN somem perto das centenas de MB do SFU.
 */
function MediaUsageChartView({ points, bucket, series }: MediaUsageChartViewProps) {
  const { t, i18n } = useTranslation()
  const config = { [series]: { label: t(LABELS[series]), color: COLORS[series] } } satisfies ChartConfig
  const time = (at: string, options: Intl.DateTimeFormatOptions) => new Date(at).toLocaleString(i18n.language, options)
  const bytes = (value: number) => formatBytes(value, i18n.language)

  return (
    <ChartContainer config={config} className="aspect-auto h-40 w-full">
      <AreaChart data={points} margin={{ top: 12, left: 0, right: 12 }}>
        <defs>
          <linearGradient id={`fill-${series}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={`var(--color-${series})`} stopOpacity={0.8} />
            <stop offset="95%" stopColor={`var(--color-${series})`} stopOpacity={0.1} />
          </linearGradient>
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
        <YAxis width={64} tickLine={false} axisLine={false} tickCount={4} tickFormatter={bytes} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, payload) =>
                time(String(payload[0]?.payload?.at ?? ''), { dateStyle: 'medium', timeStyle: 'short' })
              }
              formatter={(value) => (
                <div className="flex w-full items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: `var(--color-${series})` }} />
                  <span className="text-muted-foreground">{config[series].label}</span>
                  <span className="ml-auto font-mono font-medium tabular-nums">{bytes(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey={series}
          type="monotone"
          fill={`url(#fill-${series})`}
          stroke={`var(--color-${series})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export { MediaUsageChartView }
export type { MediaUsageChartViewProps, UsageSeries }
