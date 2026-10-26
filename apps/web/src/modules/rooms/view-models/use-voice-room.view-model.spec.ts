import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { idleVoice } from '@/modules/rooms/model/entities/voice-state'

import { useVoiceStore } from './stores/voice.store'
import { useVoiceRoomViewModel } from './use-voice-room.view-model'
import { voiceController } from './voice.controller'

describe('useVoiceRoomViewModel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useVoiceStore.setState({ ...idleVoice })
  })

  it('reads the call from the store', () => {
    const { result } = renderHook(() => useVoiceRoomViewModel())
    expect(result.current.connection).toBeNull()
    act(() => useVoiceStore.setState({ connection: { serverId: 's1', roomId: 'r1' }, micDenied: true }))
    expect(result.current.connection).toEqual({ serverId: 's1', roomId: 'r1' })
    expect(result.current.micDenied).toBe(true)
  })

  it('shows deafen as muted too, since the microphone is silenced either way', () => {
    const { result } = renderHook(() => useVoiceRoomViewModel())
    expect([result.current.isMuted, result.current.isDeafened]).toEqual([false, false])
    act(() => useVoiceStore.setState({ muted: true }))
    expect([result.current.isMuted, result.current.isDeafened]).toEqual([true, false])
    act(() => useVoiceStore.setState({ muted: false, deafened: true }))
    expect([result.current.isMuted, result.current.isDeafened]).toEqual([true, true])
  })

  it('sends the actions to the controller', () => {
    const join = vi.spyOn(voiceController, 'join').mockResolvedValue()
    const leave = vi.spyOn(voiceController, 'leave').mockResolvedValue()
    const mute = vi.spyOn(voiceController, 'toggleMute').mockImplementation(() => undefined)
    const deafen = vi.spyOn(voiceController, 'toggleDeafen').mockImplementation(() => undefined)
    const volume = vi.spyOn(voiceController, 'setVolume').mockImplementation(() => undefined)
    const { result } = renderHook(() => useVoiceRoomViewModel())
    result.current.joinRoom('s1', 'r2')
    result.current.leaveRoom()
    result.current.toggleMute()
    result.current.toggleDeafen()
    result.current.setVolume('u2', 80)
    expect(join).toHaveBeenCalledWith('s1', 'r2')
    expect(leave).toHaveBeenCalled()
    expect(mute).toHaveBeenCalled()
    expect(deafen).toHaveBeenCalled()
    expect(volume).toHaveBeenCalledWith('u2', 80)
  })
})
