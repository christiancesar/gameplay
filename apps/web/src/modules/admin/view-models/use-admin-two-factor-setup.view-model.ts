import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { mapTwoFactorSetupError } from '@/modules/admin/model/mappers/two-factor-setup-error.mapper'
import { totpSecret } from '@/modules/admin/model/rules/totp-secret'
import { copyText, downloadTextFile } from '@/modules/admin/model/services/browser.service'
import { enableTwoFactor, verifyTwoFactorCode } from '@/modules/admin/model/services/two-factor.service'
import type { ConfirmPasswordValues } from '@/modules/admin/model/two-factor-setup.schema'
import type { AuthClientError } from '@/modules/auth/model/mappers/auth-error.mapper'
import { refreshSession } from '@/modules/auth/model/services/session.query'
import type { TwoFactorCodeValues } from '@/modules/auth/model/two-factor.schema'
import type { TwoFactorSetupState } from '@/modules/admin/model/entities/two-factor-setup-state'

const RECOVERY_CODES_FILE = 'gameplay-recovery-codes.txt'

/**
 * `/admin/setup`: password, QR plus code, recovery codes. Better Auth only turns the 2FA on once the code is
 * verified, and the recovery codes come with the first step but are shown after the verification.
 */
function useAdminTwoFactorSetupViewModel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [verified, setVerified] = useState(false)
  const [copied, setCopied] = useState(false)

  // Errors that do not belong to a field become a toast.
  const toastError = (error: unknown) => {
    const mapped = mapTwoFactorSetupError(error as AuthClientError)
    if (mapped.target === 'toast') toast.error(t(`auth.errors.${mapped.key}`))
  }
  const enable = useMutation({ mutationFn: enableTwoFactor, onError: toastError })
  const verify = useMutation({
    mutationFn: verifyTwoFactorCode,
    onSuccess: () => setVerified(true),
    onError: toastError,
  })

  const enrollment = enable.data
  const fieldError = (mutationError: unknown) =>
    mutationError ? mapTwoFactorSetupError(mutationError as AuthClientError).target : undefined

  const state: TwoFactorSetupState =
    enrollment && verified
      ? { step: 'recovery', recoveryCodes: enrollment.recoveryCodes, copied }
      : enrollment
        ? {
            step: 'scan',
            qrCodeUrl: enrollment.qrCodeUrl,
            secret: totpSecret(enrollment.totpUri),
            isVerifying: verify.isPending,
            invalidCode: fieldError(verify.error) === 'code',
          }
        : { step: 'password', isSubmitting: enable.isPending, invalidPassword: fieldError(enable.error) === 'password' }

  const recoveryText = () => enrollment?.recoveryCodes.join('\n') ?? ''

  return {
    state,
    onConfirmPassword: (values: ConfirmPasswordValues) => enable.mutate(values.password),
    onVerify: (values: TwoFactorCodeValues) => verify.mutate(values.code),
    onCopyCodes: () => void copyText(recoveryText()).then(() => setCopied(true)),
    onDownloadCodes: () => downloadTextFile(RECOVERY_CODES_FILE, recoveryText()),
    // The session says twoFactorEnabled now; the guard only lets the admin into the panel after the refresh.
    onFinish: async () => {
      await refreshSession(queryClient)
      await navigate({ to: '/admin/users' })
    },
  }
}

export { useAdminTwoFactorSetupViewModel }
