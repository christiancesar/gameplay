import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { realtime } from '@/modules/realtime/model/services/realtime.service'
import { leaveVoiceRoom } from '@/modules/rooms/view-models/voice.controller'
import { authClient } from '@/shared/lib/auth-client'
import { telemetry } from '@/shared/lib/telemetry/current-telemetry'

/** Ends the session. The confirmation dialog belongs to the Screen that opens it. */
function useSignOutViewModel() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => authClient.signOut(),
    // Even when the request fails the local state must go: cached data belongs to the old account.
    onSettled: async () => {
      // Before the socket closes, so the API frees the seat at once.
      void leaveVoiceRoom()
      realtime.disconnect()
      telemetry.clearUser()
      queryClient.clear()
      await navigate({ to: '/', replace: true })
    },
  })

  return {
    isSigningOut: mutation.isPending,
    signOut: () => mutation.mutate(),
  }
}

export { useSignOutViewModel }
