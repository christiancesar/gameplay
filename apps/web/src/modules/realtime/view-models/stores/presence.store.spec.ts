import { beforeEach, describe, expect, it } from 'vitest'

import { participantAna, snapshotS1 } from '../test/realtime-seed'
import { usePresenceStore } from './presence.store'

describe('presence store', () => {
  beforeEach(() => usePresenceStore.getState().reset())

  it('keeps the snapshot', () => {
    usePresenceStore.getState().applySnapshot(snapshotS1)
    expect(usePresenceStore.getState()).toMatchObject({ serverId: 's1', onlineUserIds: ['u1', 'u2'] })
  })

  it('adds and removes online users from updates, without duplicates', () => {
    const { applySnapshot, applyUpdate } = usePresenceStore.getState()
    applySnapshot(snapshotS1)
    applyUpdate({ serverId: 's1', userId: 'u3', online: true })
    applyUpdate({ serverId: 's1', userId: 'u3', online: true })
    applyUpdate({ serverId: 's1', userId: 'u1', online: false })
    expect(usePresenceStore.getState().onlineUserIds).toEqual(['u2', 'u3'])
  })

  it('ignores updates of another server or before any snapshot', () => {
    const { applySnapshot, applyUpdate } = usePresenceStore.getState()
    applyUpdate({ serverId: 's1', userId: 'u9', online: true })
    expect(usePresenceStore.getState().onlineUserIds).toEqual([])
    applySnapshot(snapshotS1)
    applyUpdate({ serverId: 's2', userId: 'u9', online: true })
    expect(usePresenceStore.getState().onlineUserIds).toEqual(['u1', 'u2'])
  })

  it('replaces a room occupancy and drops it when it empties', () => {
    const { applySnapshot, applyRoomParticipants } = usePresenceStore.getState()
    applySnapshot(snapshotS1)
    applyRoomParticipants({ serverId: 's1', roomId: 'r1', participants: [] })
    expect(usePresenceStore.getState().rooms).toEqual([])
    applyRoomParticipants({ serverId: 's1', roomId: 'r2', participants: [participantAna] })
    expect(usePresenceStore.getState().rooms).toEqual([{ roomId: 'r2', participants: [participantAna] }])
  })

  it('resets to empty', () => {
    usePresenceStore.getState().applySnapshot(snapshotS1)
    usePresenceStore.getState().reset()
    expect(usePresenceStore.getState()).toMatchObject({ serverId: null, onlineUserIds: [], rooms: [] })
  })
})
