import { describe, expect, it } from 'vitest'

import { DEVICE_ID_KEY, getDeviceId } from './device-id.service'

const UUID_A = '7b0c1f4e-5a1d-4b8e-9c55-0d2f9a6e3c11'
const UUID_B = '0c9d2a8b-3f4e-4a6b-8d7c-1e2f3a4b5c6d'

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  }
}

describe('getDeviceId', () => {
  it('generates and stores an id on first use', () => {
    const storage = memoryStorage()
    expect(getDeviceId(storage, () => UUID_A)).toBe(UUID_A)
    expect(storage.data.get(DEVICE_ID_KEY)).toBe(UUID_A)
  })

  it('returns the stored id afterwards', () => {
    const storage = memoryStorage({ [DEVICE_ID_KEY]: UUID_A })
    expect(getDeviceId(storage, () => UUID_B)).toBe(UUID_A)
  })

  it('replaces a stored value that is not a uuid', () => {
    const storage = memoryStorage({ [DEVICE_ID_KEY]: 'garbage' })
    expect(getDeviceId(storage, () => UUID_B)).toBe(UUID_B)
    expect(storage.data.get(DEVICE_ID_KEY)).toBe(UUID_B)
  })

  it('still returns an id when storage throws', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(getDeviceId(blocked, () => UUID_A)).toBe(UUID_A)
  })

  it('still returns an id when there is no storage', () => {
    expect(getDeviceId(null, () => UUID_A)).toBe(UUID_A)
  })
})
