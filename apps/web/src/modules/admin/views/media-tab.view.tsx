import type { MediaProviderStatus, MediaResource } from '@gameplay/contracts'
import { MEDIA_RESOURCES } from '@gameplay/contracts'
import { cn } from 'cn'
import { useTranslation } from 'react-i18next'

import type { MediaTabData } from '@/modules/admin/model/entities/media-tab'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Switch } from '@/shared/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

import { MediaUsageView } from './media-usage.view'
import { SfuBudgetFormView } from './sfu-budget-form.view'

type MediaTabViewProps = {
  /** undefined enquanto carrega. */
  data?: MediaTabData
  isSaving: boolean
  onToggle: (resource: MediaResource, on: boolean) => void
  onAdjustServer: (serverId: string) => void
  isSavingBudget: boolean
  onSaveBudget: (budgetGb: number) => void
}

const STATE_TONE = { ready: 'text-emerald-500', 'not-configured': 'text-muted-foreground', failing: 'text-red-500' }
const STATE_KEY = {
  ready: 'admin.media.provider.ready',
  'not-configured': 'admin.media.provider.notConfigured',
  failing: 'admin.media.provider.failing',
} as const

/** Recursos de mídia da plataforma: SFU, Mesh e TURN, quem entrega cada um e as exceções por servidor. */
function MediaTabView({ data, isSaving, onToggle, onAdjustServer, isSavingBudget, onSaveBudget }: MediaTabViewProps) {
  const { t } = useTranslation()

  const providerLine = (resource: MediaResource, status?: MediaProviderStatus) => {
    if (resource === 'mesh' || !status)
      return { text: t('admin.media.provider.none'), tone: STATE_TONE['not-configured'] }
    return { text: t(STATE_KEY[status.state], { name: status.name ?? '' }), tone: STATE_TONE[status.state] }
  }
  const stateOf = (value: boolean | null) =>
    value === null ? null : t(value ? 'admin.media.choices.on' : 'admin.media.choices.off')

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <p className="text-muted-foreground text-sm">{t('admin.media.description')}</p>

      <ul className="flex flex-col gap-3">
        {MEDIA_RESOURCES.map((resource) => {
          const provider = providerLine(resource, resource === 'mesh' ? undefined : data?.providers[resource])
          return (
            <li key={resource} className="bg-card flex items-start gap-4 rounded-md border p-4">
              <div className="min-w-0 flex-1">
                <Label htmlFor={`media-switch-${resource}`} className="text-sm font-medium">
                  {t(`admin.media.resources.${resource}.name`)}
                </Label>
                <p className="text-muted-foreground mt-1 text-xs leading-snug">
                  {t(`admin.media.resources.${resource}.description`)}
                </p>
                <p className={cn('mt-2 text-xs', provider.tone)}>{provider.text}</p>
                {resource === 'sfu' && data && (
                  <SfuBudgetFormView
                    month={data.usage.month}
                    budgetGb={data.usage.budgetGb}
                    usedBytes={Math.max(data.usage.sfu.reportedBytes, data.usage.sfu.cloudflareBytes ?? 0)}
                    isSaving={isSavingBudget}
                    onSave={onSaveBudget}
                  />
                )}
              </div>
              <Switch
                id={`media-switch-${resource}`}
                checked={data?.settings[resource] ?? false}
                disabled={!data || isSaving}
                onCheckedChange={(on) => onToggle(resource, on)}
              />
            </li>
          )
        })}
      </ul>

      {data && <MediaUsageView usage={data.usage} />}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{t('admin.media.exceptions.title')}</h2>
        {!data || data.exceptions.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-xs">
            {t('admin.media.exceptions.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.servers.server')}</TableHead>
                {MEDIA_RESOURCES.map((resource) => (
                  <TableHead key={resource}>{t(`admin.media.resources.${resource}.name`)}</TableHead>
                ))}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.exceptions.map((exception) => (
                <TableRow key={exception.serverId}>
                  <TableCell className="font-medium">{exception.serverName}</TableCell>
                  {MEDIA_RESOURCES.map((resource) => {
                    const state = stateOf(exception.overrides[resource])
                    return (
                      <TableCell key={resource}>
                        {state ? (
                          <Badge variant="outline">{state}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right">
                    <Button variant="outline" size="xs" onClick={() => onAdjustServer(exception.serverId)}>
                      {t('admin.media.exceptions.adjust')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}

export { MediaTabView }
export type { MediaTabViewProps }
