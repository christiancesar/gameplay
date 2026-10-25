import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', async () => (await import('@/shared/test/fake-i18n')).fakeI18nModule)
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

import { idleVoice } from '@/modules/rooms/model/entities/voice-state'
import { createQueryClientContext } from '@/shared/test/query-client-context'

import { useVoiceStore } from './stores/voice.store'
import { useVoiceLifecycleViewModel } from './use-voice-lifecycle.view-model'
import { voiceController } from './voice.controller'

describe('useVoiceLifecycleViewModel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    useVoiceStore.setState({ ...idleVoice })
  })

  it('attaches the call to the query client and ends it when the layout goes away', () => {
    const attach = vi.spyOn(voiceController, 'attach').mockImplementation(() => undefined)
    const detach = vi.spyOn(voiceController, 'detach').mockImplementation(() => undefined)
    const { queryClient, wrapper } = createQueryClientContext()
    const { unmount } = renderHook(() => useVoiceLifecycleViewModel(), { wrapper })
    expect(attach).toHaveBeenCalledWith(queryClient)
    expect(detach).not.toHaveBeenCalled()
    unmount()
    expect(detach).toHaveBeenCalledTimes(1)
  })

  it('toasts why a call ended on its own, once', () => {
    vi.spyOn(voiceController, 'attach').mockImplementation(() => undefined)
    vi.spyOn(voiceController, 'detach').mockImplementation(() => undefined)
    const dismiss = vi
      .spyOn(voiceController, 'dismissNotice')
      .mockImplementation(() => useVoiceStore.setState({ notice: null }))
    renderHook(() => useVoiceLifecycleViewModel(), { wrapper: createQueryClientContext().wrapper })
    expect(toast.error).not.toHaveBeenCalled()
    act(() => useVoiceStore.setState({ notice: 'other-tab' }))
    expect(toast.error).toHaveBeenCalledWith('voice.notice.otherTab')
    expect(dismiss).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})
