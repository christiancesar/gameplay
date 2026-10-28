import { describe, expect, it } from 'vitest'

import { toHubServer, toHubUser } from './hub-view.mapper'

describe('hub view mapper', () => {
  it('shows the username, not the sign up name that does not follow a rename', () => {
    expect(
      toHubUser({ name: 'admin', username: 'christiancesar', displayUsername: 'christiancesar', email: 'a@b.c' }),
    ).toMatchObject({ name: 'christiancesar' })
  })

  it('maps a null avatar to undefined', () => {
    expect(toHubUser({ name: 'Admin', email: 'a@b.c', image: null })).toEqual({
      name: 'Admin',
      email: 'a@b.c',
      avatarUrl: undefined,
    })
  })

  it('keeps the avatar url', () => {
    expect(toHubUser({ name: 'Admin', email: 'a@b.c', image: '/img/a.webp' }).avatarUrl).toBe('/img/a.webp')
  })

  it('maps a server, dropping the role and a null icon', () => {
    expect(toHubServer({ id: 's1', name: 'Turbex', iconUrl: null, role: 'owner' })).toEqual({
      id: 's1',
      name: 'Turbex',
      iconUrl: undefined,
    })
  })
})
