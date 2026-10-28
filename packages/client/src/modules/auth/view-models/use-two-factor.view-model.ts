import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

import {
  isTwoFactorSessionLost,
  mapTwoFactorError,
  type AuthClientError,
} from '@/modules/auth/model/mappers/auth-error.mapper'
import { safeRedirect } from '@/modules/auth/model/rules/safe-redirect'
import { refreshSession } from '@/modules/auth/model/services/session.query'
import type { TwoFactorCodeValues } from '@/modules/auth/model/two-factor.schema'
import { usePendingTwoFactorStore } from '@/modules/auth/view-models/stores/pending-two-factor.store'
import { authClient } from '@/shared/lib/auth-client'

async function verifyTotp({ code }: TwoFactorCodeValues) {
  const { error } = await authClient.twoFactor.verifyTotp({ code })
  if (error) throw error
}

/** Second step of `/sign-in?step=two-factor`: code from the authenticator app. */
function useTwoFactorViewModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { redirect } = useSearch({ from: '/_guest/sign-in' })
  const pending = usePendingTwoFactorStore((state) => state.pending)
  const clear = usePendingTwoFactorStore((state) => state.clear)

  const backToCredentials = () => {
    clear()
    return navigate({ to: '/sign-in', search: { redirect }, replace: true })
  }

  // Opened without a login in progress (typed URL, reload): nothing to verify.
  useEffect(() => {
    if (!pending) void navigate({ to: '/sign-in', search: { redirect }, replace: true })
  }, [pending, redirect, navigate])

  const mutation = useMutation({
    mutationFn: verifyTotp,
    onSuccess: async () => {
      await refreshSession(queryClient)
      await navigate({ to: safeRedirect(redirect) })
      clear()
    },
    onError: (error: AuthClientError) => {
      if (isTwoFactorSessionLost(error)) void backToCredentials()
    },
  })

  return {
    isSubmitting: mutation.isPending,
    formError: mutation.error ? mapTwoFactorError(mutation.error as AuthClientError) : undefined,
    onSubmit: (values: TwoFactorCodeValues) => mutation.mutate(values),
    onBack: () => void backToCredentials(),
    onUseRecoveryCodeClick: () => void navigate({ to: '/sign-in', search: { step: 'recovery-code', redirect } }),
  }
}

export { useTwoFactorViewModel }
