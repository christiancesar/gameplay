import { describe, expect, it } from 'vitest'

import { createCallMemory } from './call-memory.service'
import { createFakeStorage } from './test/fake-storage'

describe('createCallMemory', () => {
  it('remembers the room, stamps when the page left and forgets it', () => {
    const { storage } = createFakeStorage()
    const memory = createCallMemory(() => storage)
    expect(memory.read()).toBeNull()

    memory.remember({ serverId: 's1', roomId: 'r1' })
    expect(memory.read()).toEqual({ serverId: 's1', roomId: 'r1', leftAt: null })
    memory.markLeft(5_000)
    expect(memory.read()).toEqual({ serverId: 's1', roomId: 'r1', leftAt: 5_000 })
    memory.forget()
    expect(memory.read()).toBeNull()
  })

  it('stamps nothing outside a call', () => {
    const { storage, items } = createFakeStorage()
    createCallMemory(() => storage).markLeft(5_000)
    expect(items.size).toBe(0)
  })

  it('ignores what it cannot read', () => {
    const { storage, items } = createFakeStorage()
    items.set('gameplay:voice-call', '{not json')
    expect(createCallMemory(() => storage).read()).toBeNull()
    items.set('gameplay:voice-call', JSON.stringify({ roomId: 'r1' }))
    expect(createCallMemory(() => storage).read()).toBeNull()
  })

  it('never throws when storage is blocked', () => {
    const { storage } = createFakeStorage({ broken: true })
    const memory = createCallMemory(() => storage)
    expect(() => {
      memory.remember({ serverId: 's1', roomId: 'r1' })
      memory.markLeft(1)
      memory.forget()
    }).not.toThrow()
    expect(memory.read()).toBeNull()
  })
})
