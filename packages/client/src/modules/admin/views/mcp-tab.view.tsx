import { ServerIcon, SquareIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { McpClient, McpTool } from '@gameplay/contracts'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'

type McpState = 'inactive' | 'starting' | 'active' | 'unavailable'

type McpTabViewProps = {
  state: McpState
  endpoint?: string
  token?: string
  configuration?: string
  tools: readonly McpTool[]
  clients: readonly McpClient[]
  documentation: readonly string[]
  onStart: () => void
  onStop: () => void
}

function McpTabView({
  state,
  endpoint,
  token,
  configuration,
  tools,
  clients,
  documentation,
  onStart,
  onStop,
}: McpTabViewProps) {
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
            <ConfirmDialog
              trigger={
                <Button className="mt-4" disabled={busy || state === 'unavailable'}>
                  {t(busy ? 'admin.mcp.starting' : 'admin.mcp.start')}
                </Button>
              }
              title={t('admin.mcp.startTitle')}
              description={t('admin.mcp.startDescription')}
              confirmLabel={t('admin.mcp.confirmStart')}
              cancelLabel={t('common.cancel')}
              onConfirm={onStart}
            />
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

      <section aria-labelledby="mcp-tools-title">
        <div className="flex items-center justify-between gap-3">
          <h3 id="mcp-tools-title" className="text-sm font-medium">
            {t('admin.mcp.toolsTitle')}
          </h3>
          <Badge variant="outline">{tools.length}</Badge>
        </div>
        {tools.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {tools.map((tool) => (
              <article key={tool.key} className="border-border bg-card rounded-lg border p-4">
                <p className="font-mono text-sm font-medium">{tool.key}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{tool.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">{t('admin.mcp.toolsEmpty')}</p>
        )}
      </section>

      <section aria-labelledby="mcp-clients-title">
        <div className="flex items-center justify-between gap-3">
          <h3 id="mcp-clients-title" className="text-sm font-medium">
            {t('admin.mcp.clientsTitle')}
          </h3>
          <Badge variant="outline">{clients.length}</Badge>
        </div>
        {clients.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {clients.map((client) => (
              <article
                key={`${client.name}-${client.connectedAt}`}
                className="border-border bg-card rounded-lg border p-4"
              >
                <p className="text-sm font-medium">{client.name}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t('admin.mcp.clientVersion', { version: client.version })}
                </p>
                <p className="text-muted-foreground mt-3 text-xs">
                  {t('admin.mcp.clientConnectedAt', { at: new Date(client.connectedAt).toLocaleString() })}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t('admin.mcp.clientLastSeenAt', { at: new Date(client.lastSeenAt).toLocaleString() })}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">{t('admin.mcp.clientsEmpty')}</p>
        )}
      </section>

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
