import { InMemoryPresenceStore } from './in-memory-presence.store'

describe('InMemoryPresenceStore', () => {
  it('goes online with the first tab and offline with the last one', async () => {
    const presence = new InMemoryPresenceStore()

    expect(await presence.add('ana', 'tab-1')).toBe(true)
    expect(await presence.add('ana', 'tab-2')).toBe(false)
    expect(await presence.remove('ana', 'tab-1')).toBe(false)
    expect(await presence.isOnline('ana')).toBe(true)
    expect(await presence.remove('ana', 'tab-2')).toBe(true)
    expect(await presence.isOnline('ana')).toBe(false)
  })

  it('ignores a socket it does not know', async () => {
    const presence = new InMemoryPresenceStore()
    await presence.add('ana', 'tab-1')

    expect(await presence.remove('ana', 'other')).toBe(false)
    expect(await presence.remove('bia', 'tab-1')).toBe(false)
    expect(await presence.isOnline('ana')).toBe(true)
  })

  it('lists who is online', async () => {
    const presence = new InMemoryPresenceStore()
    await presence.add('ana', 'tab-1')
    await presence.add('bia', 'tab-2')

    expect(await presence.onlineAmong(['bia', 'caio', 'ana'])).toEqual(['bia', 'ana'])
    expect(await presence.onlineUserIds()).toEqual(['ana', 'bia'])
  })
})
