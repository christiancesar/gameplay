import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

import { authClient } from '@/shared/lib/auth-client'

export function useSignOutViewModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut()
    } finally {
      queryClient.clear()
      await navigate({ to: '/sign-in', replace: true })
    }
  }, [navigate, queryClient])

  return { signOut }
}
