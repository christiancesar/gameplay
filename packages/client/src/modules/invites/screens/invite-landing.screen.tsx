import { useInviteLandingViewModel } from '@/modules/invites/view-models/use-invite-landing.view-model'
import { InviteLandingView } from '@/modules/invites/views/invite-landing.view'

export function InviteLandingScreen() {
  const { state, ...callbacks } = useInviteLandingViewModel()

  // The invite is loading; the answer is a single quick request.
  if (!state) return null
  return <InviteLandingView state={state} {...callbacks} />
}
