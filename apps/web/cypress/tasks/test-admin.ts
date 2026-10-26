import { postAuth } from './auth-api.ts'
import { generateTotp } from './totp.ts'
import { createUser, PASSWORD, type TestAdmin } from './test-users.ts'

/** A platform admin whose 2FA is already on, set up through the real API (the UI setup has its own spec). */
async function createAdminWithTwoFactor(runId: string, tag: string): Promise<TestAdmin> {
  const user = await createUser(runId, { tag, role: 'admin' })

  const signIn = await postAuth('/sign-in/email', { email: user.email, password: PASSWORD })
  const enable = await postAuth('/two-factor/enable', { password: PASSWORD }, signIn.cookies)
  const uri = String(enable.body.totpURI)
  const secret = new URL(uri).searchParams.get('secret')
  if (!secret) throw new Error('The TOTP URI has no secret')
  const verify = await postAuth('/two-factor/verify-totp', { code: generateTotp(secret) }, enable.cookies)
  if (verify.status !== 200) throw new Error(`Two-factor verification failed with ${verify.status}`)

  return { ...user, secret, recoveryCodes: enable.body.backupCodes as string[] }
}

export { createAdminWithTwoFactor }
