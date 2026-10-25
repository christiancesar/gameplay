import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { realtime } from '@/modules/realtime/model/services/realtime.service'
import { authClient } from '@/shared/lib/auth-client'

/** Ends the session. The confirmation dialog belongs to the Screen that opens it. */
function useSignOutViewModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => authClient.signOut(),
    // Even when the request fails the local state must go: cached data belongs to the old account.
    onSettled: async () => {
      realtime.disconnect()
      queryClient.clear()
      await navigate({ to: '/sign-in', replace: true })
    },
  })

  return {
    isSigningOut: mutation.isPending,
    signOut: () => mutation.mutate(),
  }
}

export { useSignOutViewModel }
