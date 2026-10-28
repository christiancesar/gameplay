import { describe, expect, it } from 'vitest'

import { FakeServerAddressProvider } from '../test/fake-server-address.provider'
import { ServerAddressService } from './server-address.service'

describe('ServerAddressService', () => {
  it('starts with no server, and with the one kept after load', async () => {
    const service = new ServerAddressService(new FakeServerAddressProvider('https://play.example.com'))
    expect(service.current()).toBeNull()

    await service.load()

    expect(service.current()).toBe('https://play.example.com')
  })

  it('keeps the server that was set, for this run and the next', async () => {
    const provider = new FakeServerAddressProvider()
    const service = new ServerAddressService(provider)

    await service.set('http://localhost:8080')

    expect(service.current()).toBe('http://localhost:8080')
    expect(provider.writes).toEqual(['http://localhost:8080'])
  })

  it('refuses what is not a server origin and keeps what it had', async () => {
    const provider = new FakeServerAddressProvider('https://play.example.com')
    const service = new ServerAddressService(provider)
    await service.load()

    await expect(service.set('http://play.example.com')).rejects.toThrow()
    await expect(service.set('https://play.example.com/api')).rejects.toThrow()

    expect(service.current()).toBe('https://play.example.com')
    expect(provider.writes).toEqual([])
  })

  it('tells what is on the server, and nothing before there is one', async () => {
    const service = new ServerAddressService(new FakeServerAddressProvider('https://play.example.com'))
    expect(service.isOnServer('https://play.example.com/api/health')).toBe(false)

    await service.load()

    expect(service.isOnServer('https://play.example.com/api/health')).toBe(true)
    expect(service.isOnServer('https://other.example.com/api/health')).toBe(false)
    expect(service.isOnServer('nonsense')).toBe(false)
  })

  describe('in a build tied to a server', () => {
    it('talks to that server only, whatever the data folder kept', async () => {
      const provider = new FakeServerAddressProvider('https://old.example.com')
      const service = new ServerAddressService(provider, 'https://play.example.com')

      await service.load()

      expect(service.current()).toBe('https://play.example.com')
      expect(service.isOnServer('https://play.example.com/api/health')).toBe(true)
      expect(service.isOnServer('https://old.example.com/api/health')).toBe(false)
    })

    it('refuses to set another server and keeps nothing', async () => {
      const provider = new FakeServerAddressProvider()
      const service = new ServerAddressService(provider, 'https://play.example.com')
      await service.load()

      await expect(service.set('https://other.example.com')).rejects.toThrow('one server only')

      expect(service.current()).toBe('https://play.example.com')
      expect(provider.writes).toEqual([])
    })
  })
})
