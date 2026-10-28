import { z } from 'zod'

const DEVICE_ID_KEY = 'gameplay-device-id'

type DeviceIdStorage = Pick<Storage, 'getItem' | 'setItem'>

/**
 * The id of this browser, one per device. Generated on first use and kept in localStorage; when
 * storage is blocked a fresh id is returned each time and the API will see a new device.
 */
function getDeviceId(
  storage: DeviceIdStorage | null = safeLocalStorage(),
  generate: () => string = () => crypto.randomUUID(),
): string {
  try {
    const stored = storage?.getItem(DEVICE_ID_KEY)
    if (stored && z.uuid().safeParse(stored).success) return stored
  } catch {
    return generate()
  }
  const created = generate()
  try {
    storage?.setItem(DEVICE_ID_KEY, created)
  } catch {
    // Blocked storage: the id just won't survive a reload.
  }
  return created
}

function safeLocalStorage(): Storage | null {
  try {
    return localStorage
  } catch {
    return null
  }
}

export { DEVICE_ID_KEY, getDeviceId }
export type { DeviceIdStorage }
