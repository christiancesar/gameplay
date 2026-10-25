import { reportDeviceRequestSchema } from '@gameplay/shared'
import { makeCollected } from '../test/hardware-seed'

const deviceId = '6f1c2a52-8a3b-4d0e-9a39-0d8e6c1f2b10'

function memoryAfterParse(deviceMemoryGb: number) {
  const parsed = reportDeviceRequestSchema.parse({ deviceId, collected: makeCollected({ deviceMemoryGb }) })
  return parsed.collected.deviceMemoryGb
}

describe('Device report schema', () => {
  it.each([
    [8, 8],
    [0.5, 0.5],
    [32, 8],
    [6, 4],
    [0.1, 0.25],
  ])('rounds deviceMemory %d down to %d with the 8 GB cap', (sent, stored) => {
    expect(memoryAfterParse(sent)).toBe(stored)
  })

  it('refuses a device id that is not a uuid', () => {
    expect(reportDeviceRequestSchema.safeParse({ deviceId: 'abc', collected: makeCollected() }).success).toBe(false)
  })

  it('refuses more than 16 monitors', () => {
    const display = {
      label: null,
      width: 1920,
      height: 1080,
      scaleFactor: 1,
      refreshRate: 144,
      isPrimary: false,
      isInternal: false,
    }
    const collected = makeCollected({ displays: Array.from({ length: 17 }, () => display) })

    expect(reportDeviceRequestSchema.safeParse({ deviceId, collected }).success).toBe(false)
  })
})
