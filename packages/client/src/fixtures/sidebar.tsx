import type { Decorator } from '@storybook/react-vite'
import type { CSSProperties } from 'react'

import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'

/** Peças da sidebar precisam do SidebarProvider; `parameters.sidebarCollapsed` mostra o estado recolhido. */
const withSidebar: Decorator = (Story, context) => (
  <SidebarProvider
    defaultOpen={!context.parameters.sidebarCollapsed}
    className="bg-sidebar h-dvh min-h-0"
    style={{ '--sidebar-width': '18rem' } as CSSProperties}
  >
    {Story()}
    <SidebarInset />
  </SidebarProvider>
)

export { withSidebar }
