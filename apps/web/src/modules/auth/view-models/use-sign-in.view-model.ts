import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { inviteCodeFromPath } from '@/modules/invites/model/rules/invite-path'
import { mapSignInError, type AuthClientError } from '@/modules/auth/model/mappers/auth-error.mapper'
import { safeRedirect } from '@/modules/auth/model/rules/safe-redirect'
import { refreshSession } from '@/modules/auth/model/services/session.query'
import type { SignInCredentials } from '@/modules/auth/model/sign-in.schema'
import { usePendingTwoFactorStore } from '@/modules/auth/view-models/stores/pending-two-factor.store'
import { authClient } from '@/shared/lib/auth-client'

/** Better Auth answers a successful password check with this flag when the account has 2FA. */
function needsTwoFactor(data: object | null | undefined): boolean {
  return Boolean(data && 'twoFactorRedirect' in data && data.twoFactorRedirect)
}

async function requestSignIn({ identifier, password }: SignInCredentials) {
  const { data, error } = identifier.includes('@')
    ? await authClient.signIn.email({ email: identifier, password })
    : await authClient.signIn.username({ username: identifier, password })
  if (error) throw error
  return { twoFactor: needsTwoFactor(data) }
}

/** First step of `/sign-in`: email or username and password. */
function useSignInViewModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { redirect } = useSearch({ from: '/_guest/sign-in' })
  const markPending = usePendingTwoFactorStore((state) => state.markPending)

  const mutation = useMutation({
    mutationFn: requestSignIn,
    onSuccess: async ({ twoFactor }) => {
      if (twoFactor) {
        markPending()
        await navigate({ to: '/sign-in', search: { step: 'two-factor', redirect } })
        return
      }
      await refreshSession(queryClient)
      await navigate({ to: safeRedirect(redirect) })
    },
  })

  return {
    isSubmitting: mutation.isPending,
    formError: mutation.error ? mapSignInError(mutation.error as AuthClientError) : undefined,
    onSubmit: (values: SignInCredentials) => mutation.mutate(values),
    // An invite link keeps its server through the switch to sign-up.
    onSignUpClick: () => {
      const invite = inviteCodeFromPath(redirect)
      void navigate(invite ? { to: '/sign-up', search: { invite } } : { to: '/sign-up' })
    },
  }
}

export { useSignInViewModel }
