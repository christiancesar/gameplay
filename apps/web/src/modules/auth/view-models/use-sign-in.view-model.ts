import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

import { authClient } from '@/shared/lib/auth-client'
import { ApiError } from '@/shared/lib/api-error'
import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'

type SignInError = { code?: string; message?: string; status?: number }

function mapSignInError(error: unknown): SignInError {
  if (error instanceof ApiError) {
    return { code: error.code, message: error.message, status: error.status }
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string; status?: number }
    return { code: err.code, message: err.message, status: err.status }
  }
  return {}
}

export function useSignInViewModel() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_guest/sign-in' })
  const queryClient = useQueryClient()

  const redirectTo = useMemo(() => {
    const redirect = (search as { redirect?: string }).redirect
    if (redirect && redirect.startsWith('/')) return redirect
    return '/'
  }, [search])

  const signIn = useCallback(
    async (values: { identifier: string; password: string }) => {
      const { identifier, password } = values
      const isEmail = identifier.includes('@')
      try {
        if (isEmail) {
          const res = await authClient.signIn.email({ email: identifier, password })
          if (res.error) {
            const err = mapSignInError(res.error)
            if (err.code === 'TWO_FACTOR_REQUIRED' || err.code === 'TWO_FACTOR_NOT_ENABLED') {
              await navigate({
                to: '/sign-in',
                search: { step: 'two-factor', redirect: (search as any).redirect } as any,
                replace: true,
              })
              return { ok: false, requiresTwoFactor: true }
            }
            if (err.code === 'USER_SUSPENDED' || err.status === 403) {
              return { ok: false, formErrorKey: 'auth.errors.suspended' }
            }
            return { ok: false, formErrorKey: 'auth.errors.invalidCredentials' }
          }
        } else {
          const res = await authClient.signIn.username({ username: identifier, password })
          if (res.error) {
            const err = mapSignInError(res.error)
            if (err.code === 'TWO_FACTOR_REQUIRED') {
              await navigate({
                to: '/sign-in',
                search: { step: 'two-factor', redirect: (search as any).redirect } as any,
                replace: true,
              })
              return { ok: false, requiresTwoFactor: true }
            }
            if (err.code === 'USER_SUSPENDED' || err.status === 403) {
              return { ok: false, formErrorKey: 'auth.errors.suspended' }
            }
            return { ok: false, formErrorKey: 'auth.errors.invalidCredentials' }
          }
        }
        await queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey })
        await navigate({ to: redirectTo })
        return { ok: true }
      } catch (error) {
        const err = mapSignInError(error)
        if (err.code === 'USER_SUSPENDED' || err.status === 403) {
          return { ok: false, formErrorKey: 'auth.errors.suspended' }
        }
        return { ok: false, formErrorKey: 'auth.errors.invalidCredentials' }
      }
    },
    [navigate, queryClient, redirectTo, search],
  )

  const goToSignUp = useCallback(() => {
    const invite = (search as { invite?: string }).invite
    navigate({ to: '/sign-up', search: invite ? ({ invite } as any) : ({} as any) })
  }, [navigate, search])

  return { signIn, goToSignUp, redirectTo }
}
