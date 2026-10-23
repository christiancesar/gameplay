import type { ReactNode } from 'react'

import { BrandLogo } from '@/shared/ui/brand-logo'

type ServerScreenViewProps = {
  sidebar: ReactNode
  /** Conteúdo da área principal. Sem conteúdo, mostra o logo (fora de sala). */
  main?: ReactNode
}

function ServerScreenView({ sidebar, main }: ServerScreenViewProps) {
  return (
    <div className="bg-background text-foreground flex h-dvh gap-3 p-3">
      {sidebar}
      <main className="bg-card text-card-foreground min-w-0 flex-1 overflow-y-auto rounded-xl border">
        {main ?? (
          <div className="flex h-full items-center justify-center">
            <BrandLogo variant="unlimited" className="w-64 opacity-90" />
          </div>
        )}
      </main>
    </div>
  )
}

export { ServerScreenView }
export type { ServerScreenViewProps }
