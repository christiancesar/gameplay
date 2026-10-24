import type { AuthHookContext } from '@thallesp/nestjs-better-auth'
import { APIError } from 'better-auth/api'
import { SignUpHook } from './sign-up.hook'

function contextWith(body: Record<string, unknown>) {
  return { body } as unknown as AuthHookContext
}

describe('SignUpHook', () => {
  const hook = new SignUpHook()

  it('uses the username as the display name', () => {
    const ctx = contextWith({ username: 'ana_01', registrationKey: 'abc234' })

    hook.handle(ctx)

    expect(ctx.body.name).toBe('ana_01')
  })

  it.each([
    ['missing key', { username: 'ana_01' }],
    ['key with an ambiguous character', { username: 'ana_01', registrationKey: 'ABC10O' }],
    ['invalid username', { username: 'a', registrationKey: 'ABC234' }],
  ])('refuses a %s', (_case, body) => {
    expect(() => hook.handle(contextWith(body))).toThrow(APIError)
  })
})
