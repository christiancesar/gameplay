import { useNavigate } from '@tanstack/react-router'

import { parseInviteCode } from '@/modules/invites/model/rules/parse-invite-code'

/** "Join a server" field of the Hub: the invite page does the actual join. */
function useJoinByCodeViewModel() {
  const navigate = useNavigate()

  return {
    // Navigation is instant, so the field never shows a pending state or a server error.
    isJoining: false,
    onJoin: (input: string) => {
      const code = parseInviteCode(input)
      if (code) void navigate({ to: '/i/$code', params: { code } })
    },
  }
}

export { useJoinByCodeViewModel }
