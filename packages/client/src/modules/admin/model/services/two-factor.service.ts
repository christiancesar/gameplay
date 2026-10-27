import QRCode from 'qrcode'

import { authClient } from '@/shared/lib/auth-client'

type TwoFactorEnrollment = { totpUri: string; qrCodeUrl: string; recoveryCodes: string[] }

/** Starts the enrollment: Better Auth returns the TOTP URI and the recovery codes (the 2FA stays off until verified). */
async function enableTwoFactor(password: string): Promise<TwoFactorEnrollment> {
  const { data, error } = await authClient.twoFactor.enable({ password })
  if (error) throw error
  // Better Auth also supports e-mailed codes (`otp`); the admin flow is authenticator app only.
  if (data.method !== 'totp') throw new Error('Authenticator app enrollment expected')
  const qrCodeUrl = await QRCode.toDataURL(data.totpURI, { margin: 1, width: 176 })
  return { totpUri: data.totpURI, qrCodeUrl, recoveryCodes: data.backupCodes }
}

async function verifyTwoFactorCode(code: string): Promise<void> {
  const { error } = await authClient.twoFactor.verifyTotp({ code })
  if (error) throw error
}

export { enableTwoFactor, verifyTwoFactorCode }
export type { TwoFactorEnrollment }
