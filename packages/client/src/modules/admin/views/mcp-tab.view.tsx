import { ServerIcon, SquareIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'

type McpState = 'inactive' | 'starting' | 'active' | 'unavailable'

type McpTabViewProps = {
  state: McpState
  endpoint?: string
  token?: string
  configuration?: string
  documentation: readonly string[]
  onStart: () => void
  onStop: () => void
}

function McpTabView({ state, endpoint, token, configuration, documentation, onStart, onStop }: McpTabViewProps) {
  const { t } = useTranslation()
  const active = state === 'active'
  const busy = state === 'starting'

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium">{t('admin.mcp.title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('admin.mcp.description')}</p>
      </div>

      <div className="border-border bg-card flex items-start gap-3 rounded-lg border p-4">
        <ServerIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">{t('admin.mcp.server')}</p>
            <Badge variant={active ? 'default' : 'outline'}>{t(`admin.mcp.states.${state}`)}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{t(`admin.mcp.stateDescriptions.${state}`)}</p>
          {!active && (
            <Button className="mt-4" disabled={busy || state === 'unavailable'} onClick={onStart}>
              {t(busy ? 'admin.mcp.starting' : 'admin.mcp.start')}
            </Button>
          )}
          {active && (
            <ConfirmDialog
              trigger={
                <Button className="mt-4" variant="destructive">
                  <SquareIcon data-icon="inline-start" aria-hidden />
                  {t('admin.mcp.stop')}
                </Button>
              }
              title={t('admin.mcp.stopTitle')}
              description={t('admin.mcp.stopDescription')}
              confirmLabel={t('admin.mcp.confirmStop')}
              cancelLabel={t('common.cancel')}
              destructive
              onConfirm={onStop}
            />
          )}
        </div>
      </div>

      {active && endpoint && token && configuration && (
        <section aria-labelledby="mcp-connection-title">
          <h3 id="mcp-connection-title" className="text-sm font-medium">
            {t('admin.mcp.connectionTitle')}
          </h3>
          <div className="mt-3 flex flex-col gap-3">
            <p className="font-mono text-xs">{endpoint}</p>
            <p className="text-muted-foreground text-xs">{t('admin.mcp.token', { token })}</p>
            <pre className="bg-muted overflow-x-auto rounded-lg p-4 font-mono text-xs">{configuration}</pre>
          </div>
        </section>
      )}

      <section aria-labelledby="mcp-docs-title">
        <h3 id="mcp-docs-title" className="text-sm font-medium">
          {t('admin.mcp.docsTitle')}
        </h3>
        <div className="text-muted-foreground mt-2 flex flex-col gap-2 text-sm leading-relaxed">
          {documentation.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </div>
  )
}

export { McpTabView }
export type { McpState, McpTabViewProps }
