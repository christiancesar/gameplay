import { BugIcon, CableIcon, CodeXmlIcon, TerminalIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { DiagnosticsStatus } from '@gameplay/contracts'

import { Badge } from '@/shared/ui/badge'

type DevelopmentResourceId = 'diagnostics' | 'cdp' | 'mainInspector' | 'devtools'
type DevelopmentResource = { id: DevelopmentResourceId; active: boolean; port?: number | null }

type DevelopmentTabViewProps = {
  status: DiagnosticsStatus
  documentation: readonly string[]
}

const RESOURCE_ICONS = {
  diagnostics: BugIcon,
  cdp: CableIcon,
  mainInspector: TerminalIcon,
  devtools: CodeXmlIcon,
} as const

function DevelopmentTabView({ status, documentation }: DevelopmentTabViewProps) {
  const { t } = useTranslation()
  const resources: DevelopmentResource[] = [
    { id: 'diagnostics', active: status.diagnostics },
    { id: 'cdp', active: status.cdpPort !== null, port: status.cdpPort },
    { id: 'mainInspector', active: status.mainInspectPort !== null, port: status.mainInspectPort },
    { id: 'devtools', active: status.devtools },
  ]

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium">{t('admin.development.title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('admin.development.description')}</p>
      </div>

      <div className="border-border bg-card rounded-lg border p-4">
        <p className="text-sm font-medium">{t('admin.development.localOnly.title')}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t('admin.development.localOnly.description')}</p>
      </div>

      <section aria-labelledby="development-resources-title">
        <h3 id="development-resources-title" className="text-sm font-medium">
          {t('admin.development.resourcesTitle')}
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {resources.map((resource) => {
            const Icon = RESOURCE_ICONS[resource.id]
            return (
              <div key={resource.id} className="border-border bg-card flex items-start gap-3 rounded-lg border p-4">
                <Icon className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{t(`admin.development.resources.${resource.id}.title`)}</p>
                    <Badge variant={resource.active ? 'default' : 'outline'}>
                      {t(resource.active ? 'admin.development.active' : 'admin.development.inactive')}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {t(`admin.development.resources.${resource.id}.description`)}
                  </p>
                  {resource.active && resource.port !== undefined && resource.port !== null && (
                    <p className="mt-2 font-mono text-xs">127.0.0.1:{resource.port}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="development-start-title">
        <h3 id="development-start-title" className="text-sm font-medium">
          {t('admin.development.startTitle')}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">{t('admin.development.startDescription')}</p>
        <pre className="bg-muted mt-3 overflow-x-auto rounded-lg p-4 font-mono text-xs">
          {t('admin.development.command')}
        </pre>
      </section>

      <section aria-labelledby="development-docs-title">
        <h3 id="development-docs-title" className="text-sm font-medium">
          {t('admin.development.docsTitle')}
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

export { DevelopmentTabView }
export type { DevelopmentResource, DevelopmentResourceId, DevelopmentTabViewProps }
