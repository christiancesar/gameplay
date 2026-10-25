import { useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

import { authClient } from '@/shared/lib/auth-client'
import { ApiError } from '@/shared/lib/api-error'
import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'

function mapError(error: unknown) {
  if (error instanceof ApiError) return error
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string; status?: number }
    throw new ApiError({ code: err.code ?? 'UNKNOWN_ERROR', message: err.message ?? '' }, err.status)
  }
  throw new ApiError({ code: 'UNKNOWN_ERROR', message: '' })
}

export function useTwoFactorViewModel() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_guest/sign-in' })
  const queryClient = useQueryClient()

  const verifyTotp = useCallback(
    async (code: string) => {
      try {
        const res = await (authClient.twoFactor as any).verifyTotp({ code })
        if (res?.error) throw res.error
        await queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey })
        const redirect = (search as { redirect?: string }).redirect
        await navigate({ to: redirect && redirect.startsWith('/') ? redirect : '/' })
        return { ok: true }
      } catch (error) {
        try {
          mapError(error)
        } catch {}
        return { ok: false, formErrorKey: 'auth.errors.invalidCode' }
      }
    },
    [navigate, queryClient, search],
  )

  const goBack = useCallback(() => {
    navigate({
      to: '/sign-in',
      search: (search as any).redirect ? { redirect: (search as any).redirect } : {},
      replace: true,
    })
  }, [navigate, search])

  const goToRecovery = useCallback(() => {
    navigate({ to: '/sign-in', search: { ...(search as any), step: 'recovery-code' } as any })
  }, [navigate, search])

  return { verifyTotp, goBack, goToRecovery }
}
