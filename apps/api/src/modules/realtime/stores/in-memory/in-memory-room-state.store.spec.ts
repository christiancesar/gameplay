import type { Seat } from '../../domain/seat'
import { InMemoryRoomStateStore } from './in-memory-room-state.store'

const seat = (userId: string, roomId: string, socketId: string | null = `${userId}-tab`): Seat => ({
  userId,
  serverId: 's1',
  roomId,
  socketId,
  muted: false,
  deafened: false,
  streaming: null,
})

describe('InMemoryRoomStateStore', () => {
  it('counts seats and screen shares across rooms', async () => {
    const store = new InMemoryRoomStateStore()
    await store.join('ana', () => ({ ...seat('ana', 'r1'), streaming: '1080p60' }))
    await store.join('bia', () => seat('bia', 'r2', null))

    expect(await store.stats()).toEqual({ seats: 2, streaming: 1 })
  })

  it('keeps one seat per person and moves it to the end of the new room', async () => {
    const store = new InMemoryRoomStateStore()
    await store.join('ana', () => seat('ana', 'r1'))
    await store.join('bia', () => seat('bia', 'r1'))
    await store.join('ana', () => seat('ana', 'r2'))
    await store.join('ana', () => seat('ana', 'r1'))

    expect((await store.listRoom('r1')).map(({ userId }) => userId)).toEqual(['bia', 'ana'])
    expect(await store.listRoom('r2')).toEqual([])
  })

  it('keeps the place in the room when the same room is joined again', async () => {
    const store = new InMemoryRoomStateStore()
    await store.join('ana', () => seat('ana', 'r1'))
    await store.join('bia', () => seat('bia', 'r1'))
    const { previous } = await store.join('ana', () => seat('ana', 'r1', 'ana-tab-2'))

    expect(previous?.socketId).toBe('ana-tab')
    expect((await store.listRoom('r1')).map(({ userId }) => userId)).toEqual(['ana', 'bia'])
  })

  it('changes a seat only from the socket holding it', async () => {
    const store = new InMemoryRoomStateStore()
    await store.join('ana', () => seat('ana', 'r1'))

    expect(await store.update('ana', 'other-tab', { muted: true })).toBeNull()
    expect(await store.update('ana', 'ana-tab', { muted: true })).toMatchObject({ muted: true })
    expect(await store.remove('ana', 'other-tab')).toBeNull()
  })

  it('removes a detached seat only while nobody took it back', async () => {
    const store = new InMemoryRoomStateStore()
    await store.join('ana', () => seat('ana', 'r1'))
    await store.detach('ana', 'ana-tab')
    await store.join('ana', () => seat('ana', 'r1', 'ana-tab-2'))

    expect(await store.remove('ana', null)).toBeNull()
    await store.detach('ana', 'ana-tab-2')
    expect(await store.remove('ana', null)).toMatchObject({ userId: 'ana' })
  })

  it('hands out copies', async () => {
    const store = new InMemoryRoomStateStore()
    const { seat: joined } = await store.join('ana', () => seat('ana', 'r1'))
    joined.muted = true

    expect(await store.find('ana')).toMatchObject({ muted: false })
  })
})
