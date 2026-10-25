import { useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

import { authClient } from '@/shared/lib/auth-client'
import { sessionQueryOptions } from '@/modules/auth/model/services/session.query'

export function useRecoveryCodeViewModel() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_guest/sign-in' })
  const queryClient = useQueryClient()

  const verifyRecovery = useCallback(
    async (code: string) => {
      try {
        const res = await (authClient.twoFactor as any).verifyBackupCode({ code })
        if (res?.error) return { ok: false, formErrorKey: 'auth.errors.invalidRecoveryCode' }
        await queryClient.invalidateQueries({ queryKey: sessionQueryOptions.queryKey })
        const redirect = (search as { redirect?: string }).redirect
        await navigate({ to: redirect && redirect.startsWith('/') ? redirect : '/' })
        return { ok: true }
      } catch {
        return { ok: false, formErrorKey: 'auth.errors.invalidRecoveryCode' }
      }
    },
    [navigate, queryClient, search],
  )

  const goBack = useCallback(() => {
    navigate({ to: '/sign-in', search: { ...(search as any), step: 'two-factor' } as any })
  }, [navigate, search])

  return { verifyRecovery, goBack }
}
