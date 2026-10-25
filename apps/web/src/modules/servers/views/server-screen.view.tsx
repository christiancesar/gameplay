import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { BrandLogo } from '@/shared/ui/brand-logo'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar'

type ServerScreenViewProps = {
  sidebar: ReactNode
  /** Conteúdo da área principal. Sem conteúdo, mostra o logo (fora de sala). */
  main?: ReactNode
  /** Sidebar aberta ou recolhida. Sem valor, a View controla sozinha (começa aberta). */
  isSidebarOpen?: boolean
  onSidebarOpenChange?: (open: boolean) => void
}

function ServerScreenView({ sidebar, main, isSidebarOpen, onSidebarOpenChange }: ServerScreenViewProps) {
  const { t } = useTranslation()

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={onSidebarOpenChange}
      className="bg-sidebar text-foreground h-dvh min-h-0"
      style={{ '--sidebar-width': '18rem' } as CSSProperties}
    >
      {sidebar}
      <SidebarInset className="min-h-0 overflow-hidden">
        {/* Below md the sidebar is a closed sheet; this bar is the only way to open it. */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2 md:hidden">
          <SidebarTrigger aria-label={t('server.openSidebar')} title={t('server.openSidebar')} />
          <BrandLogo className="w-20" />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {main ?? (
            <div className="flex h-full items-center justify-center">
              <BrandLogo variant="unlimited" className="w-64 opacity-90" />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export { ServerScreenView }
export type { ServerScreenViewProps }
