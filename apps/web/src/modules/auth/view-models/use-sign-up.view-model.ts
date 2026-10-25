import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { mapSignUpError, type AuthClientError } from '@/modules/auth/model/mappers/auth-error.mapper'
import { refreshSession } from '@/modules/auth/model/services/session.query'
import type { SignUpValues } from '@/modules/auth/model/sign-up.schema'
import { inviteLandingPath } from '@/modules/invites/model/rules/invite-path'
import { inviteQueryOptions } from '@/modules/invites/model/services/invites.query'
import { authClient } from '@/shared/lib/auth-client'

/** Sign-up is gated by a registration key; an invite link also creates the join request in the API. */
function useSignUpViewModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { invite } = useSearch({ from: '/_guest/sign-up' })

  // Shows which server the invite leads to. Any failure just hides the name.
  const resolved = useQuery({ ...inviteQueryOptions(invite ?? ''), enabled: Boolean(invite) })
  const invitedServerName = resolved.data?.status === 'active' ? resolved.data.server?.name : undefined

  const mutation = useMutation({
    mutationFn: async (values: SignUpValues) => {
      // Built outside the call: registrationKey and serverInviteCode are read by the API hook, not typed by the client.
      const body = {
        username: values.username,
        email: values.email,
        password: values.password,
        name: values.username,
        registrationKey: values.inviteKey,
        ...(invite ? { serverInviteCode: invite } : {}),
      }
      const { error } = await authClient.signUp.email(body)
      if (error) throw error
    },
    onSuccess: async () => {
      await refreshSession(queryClient)
      await navigate({ to: '/' })
    },
  })

  const errors = mutation.error ? mapSignUpError(mutation.error as AuthClientError) : undefined

  return {
    invitedServerName,
    isSubmitting: mutation.isPending,
    fieldErrors: errors?.fieldErrors,
    formError: errors?.formError,
    onSubmit: (values: SignUpValues) => mutation.mutate(values),
    onSignInClick: () =>
      void navigate(invite ? { to: '/sign-in', search: { redirect: inviteLandingPath(invite) } } : { to: '/sign-in' }),
  }
}

export { useSignUpViewModel }
