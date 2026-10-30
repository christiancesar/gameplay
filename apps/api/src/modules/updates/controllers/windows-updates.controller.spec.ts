import { NotFoundException } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import type { EnvService } from '../../../env/env.service'
import { WindowsUpdatesController } from './windows-updates.controller'

function controller(feedBaseUrl?: string) {
  const env = { get: () => feedBaseUrl } as unknown as EnvService
  return new WindowsUpdatesController(env)
}

describe('WindowsUpdatesController', () => {
  it('redirects the stable feed to the configured immutable storage prefix', () => {
    expect(controller('https://downloads.example.com/gameplay/windows').releases('stable')).toEqual({
      statusCode: 302,
      url: 'https://downloads.example.com/gameplay/windows/stable/RELEASES',
    })
  })

  it('rejects channels that are not configured', () => {
    expect(() => controller('https://downloads.example.com/gameplay/windows').releases('beta')).toThrow(
      NotFoundException,
    )
    expect(() => controller().releases('stable')).toThrow(NotFoundException)
  })
})
