import type { ExecutionContext } from '@nestjs/common'
import { TwoFactorEnabledGuard, TwoFactorRequiredError } from './platform-admin.decorator'

function contextWith(user: unknown): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as unknown as ExecutionContext
}

describe('TwoFactorEnabledGuard', () => {
  const guard = new TwoFactorEnabledGuard()

  it('lets a user with two-factor through', () => {
    expect(guard.canActivate(contextWith({ twoFactorEnabled: true }))).toBe(true)
  })

  it.each([{ twoFactorEnabled: false }, { twoFactorEnabled: null }, undefined])('refuses %o', (user) => {
    expect(() => guard.canActivate(contextWith(user))).toThrow(TwoFactorRequiredError)
  })
})
