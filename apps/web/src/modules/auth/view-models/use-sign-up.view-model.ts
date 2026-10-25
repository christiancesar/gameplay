import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

import { authClient } from '@/shared/lib/auth-client'
import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'

function normalizeKey(key: string) {
  return key.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export function useSignUpViewModel() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_guest/sign-up' })
  const queryClient = useQueryClient()

  const invite = useMemo(() => (search as { invite?: string }).invite, [search])

  const signUp = useCallback(
    async (values: any) => {
      const registrationKey = normalizeKey(values.registrationKey || values.inviteKey || '')
      try {
        const res = await (authClient.signUp as any).email({
          email: values.email,
          password: values.password,
          username: values.username,
          name: values.username,
          registrationKey,
          inviteCode: invite,
        })
        if (res?.error) {
          const code = (res.error as any).code
          if (code?.includes('KEY') || code?.includes('REGISTRATION')) {
            return { ok: false, serverErrors: { registrationKey: 'auth.errors.invalidRegistrationKey' } }
          }
          if (code?.includes('USERNAME')) {
            return { ok: false, serverErrors: { username: 'auth.errors.usernameTaken' } }
          }
          if (code?.includes('EMAIL')) {
            return { ok: false, serverErrors: { email: 'auth.errors.emailTaken' } }
          }
          return { ok: false, formErrorKey: 'auth.errors.signUpFailed' }
        }
        await queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey })
        await navigate({ to: '/' })
        return { ok: true }
      } catch (error: any) {
        const code = error?.code
        if (code?.includes('KEY') || code?.includes('REGISTRATION')) {
          return { ok: false, serverErrors: { registrationKey: 'auth.errors.invalidRegistrationKey' } }
        }
        if (code?.includes('USERNAME')) {
          return { ok: false, serverErrors: { username: 'auth.errors.usernameTaken' } }
        }
        if (code?.includes('EMAIL')) {
          return { ok: false, serverErrors: { email: 'auth.errors.emailTaken' } }
        }
        return { ok: false, formErrorKey: 'auth.errors.signUpFailed' }
      }
    },
    [invite, navigate, queryClient],
  )

  const goToSignIn = useCallback(() => {
    navigate({ to: '/sign-in', search: invite ? ({ invite } as any) : ({} as any) })
  }, [invite, navigate])

  return { signUp, goToSignIn, invite }
}
