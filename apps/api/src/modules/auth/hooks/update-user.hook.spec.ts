import type { AuthHookContext } from '@thallesp/nestjs-better-auth'
import { APIError } from 'better-auth/api'
import { UpdateUserHook } from './update-user.hook'

function contextWith(body: Record<string, unknown>) {
  return { body } as unknown as AuthHookContext
}

describe('UpdateUserHook', () => {
  const hook = new UpdateUserHook()

  it('lets the username change through', () => {
    expect(() => hook.handle(contextWith({ username: 'ana_02' }))).not.toThrow()
  })

  it('refuses an image', () => {
    expect(() => hook.handle(contextWith({ image: 'https://example.com/a.png' }))).toThrow(APIError)
  })
})
