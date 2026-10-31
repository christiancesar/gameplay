import type { MyLimits, ServerSummary } from '@gameplay/contracts'

import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'
import { createServersViewModelContext } from '@/modules/servers/view-models/test/servers-view-model-context'
import { PlatformProvider } from '@/shared/platform/platform-provider'
import { FakePlatform } from '@/shared/platform/test/fake-platform'
import type { Platform } from '@/shared/platform/platform'
import type { ReactNode } from 'react'

/** QueryClient with a cached session and the given server list behind the fake http. */
function createHubViewModelContext(
  session: object,
  servers: ServerSummary[] = [],
  limits?: MyLimits,
  platformKind: Platform['kind'] = 'browser',
) {
  const context = createServersViewModelContext(servers, limits)
  context.queryClient.setQueryData<object>([...sessionQueryOptions.queryKey], session)
  const QueryWrapper = context.wrapper
  const platform = new FakePlatform({ kind: platformKind })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PlatformProvider platform={platform}>
      <QueryWrapper>{children}</QueryWrapper>
    </PlatformProvider>
  )
  return { ...context, wrapper }
}

export { createHubViewModelContext }
