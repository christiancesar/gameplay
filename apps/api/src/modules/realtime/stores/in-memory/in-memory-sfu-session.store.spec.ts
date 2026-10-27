import type { SfuSession } from '../../domain/sfu-session'
import { InMemorySfuSessionStore } from './in-memory-sfu-session.store'

const session = (sessionId: string, userId: string): SfuSession => ({
  sessionId,
  userId,
  serverId: 's1',
  roomId: 'r1',
  published: [],
  pulled: [],
})
const video = { mid: '0', kind: 'video' as const, trackName: 'screen-video-0' }

describe('InMemorySfuSessionStore', () => {
  it('finds the latest session where the person publishes', async () => {
    const store = new InMemorySfuSessionStore()
    await store.add(session('a1', 'ana'))
    await store.add(session('a2', 'ana'))
    await store.add(session('a3', 'ana'))
    await store.addPublished('a1', [video])
    await store.addPublished('a2', [video])

    expect((await store.publicationOf('ana'))?.sessionId).toBe('a2')
    expect(await store.publicationOf('bia')).toBeNull()
  })

  it('forgets tracks by mid, and the pulls of a streamer', async () => {
    const store = new InMemorySfuSessionStore()
    await store.add(session('a1', 'ana'))
    await store.add(session('b1', 'bia'))
    await store.addPublished('a1', [video, { mid: '1', kind: 'audio', trackName: 'screen-audio-1' }])
    await store.addPulled('b1', [{ ...video, mid: '5', streamerId: 'ana', streamerSessionId: 'a1' }])

    await store.removeTracks('a1', ['1'])
    expect((await store.find('a1'))?.published).toEqual([video])

    await store.removePullsOf('ana')
    expect((await store.find('b1'))?.pulled).toEqual([])
  })

  it('hands out copies', async () => {
    const store = new InMemorySfuSessionStore()
    await store.add(session('a1', 'ana'))

    const found = await store.find('a1')
    found?.published.push(video)

    expect((await store.find('a1'))?.published).toEqual([])
  })
})
