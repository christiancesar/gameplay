import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/modules/server-choice/model/services/server-health.service', () => ({ checkServer: vi.fn() }))

import { checkServer } from '@/modules/server-choice/model/services/server-health.service'
import { PlatformProvider } from '@/shared/platform/platform-provider'
import { FakePlatform } from '@/shared/platform/test/fake-platform'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { useServerChoiceViewModel } from './use-server-choice.view-model'

function setup() {
  const platform = new FakePlatform({ kind: 'desktop', serverChoice: { chosen: null } })
  const onChosen = vi.fn()
  const { wrapper: queryWrapper } = createQueryClientContext()
  const wrapper = ({ children }: { children: ReactNode }) =>
    queryWrapper({ children: <PlatformProvider platform={platform}>{children}</PlatformProvider> })
  const hook = renderHook(() => useServerChoiceViewModel({ onChosen }), { wrapper })
  return { platform, onChosen, ...hook }
}

describe('useServerChoiceViewModel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps the origin it checked and moves on', async () => {
    vi.mocked(checkServer).mockResolvedValue('ok')
    const { result, platform, onChosen } = setup()

    act(() => result.current.onSubmit('play.example.com'))

    await waitFor(() => expect(onChosen).toHaveBeenCalled())
    expect(checkServer).toHaveBeenCalledWith('https://play.example.com')
    expect(platform.chosen).toBe('https://play.example.com')
  })

  it('refuses an address that is not one without asking the network', async () => {
    const { result, platform, onChosen } = setup()

    act(() => result.current.onSubmit('http://play.example.com'))

    await waitFor(() => expect(result.current.error).toBe('invalid'))
    expect(checkServer).not.toHaveBeenCalled()
    expect(onChosen).not.toHaveBeenCalled()
    expect(platform.chosen).toBeNull()
  })

  it.each(['unreachable', 'notGameplay'] as const)('stays on the screen when the server is %s', async (reason) => {
    vi.mocked(checkServer).mockResolvedValue(reason)
    const { result, platform, onChosen } = setup()

    act(() => result.current.onSubmit('play.example.com'))

    await waitFor(() => expect(result.current.error).toBe(reason))
    expect(onChosen).not.toHaveBeenCalled()
    expect(platform.chosen).toBeNull()
  })
})
