import { makeMembershipsContext } from '../../memberships/test/memberships-context'
import { makeRegistrationInvitesContextWithInvite } from '../../registration-invites/test/registration-invites-context'
import { SignUpHook } from '../hooks/sign-up.hook'

// The sign-up hook over the seed registration key and the memberships seed
// server, so a sign-up can come with an invite to it.
export async function makeSignUpHookContext() {
  const { invites, consume, settle } = await makeRegistrationInvitesContextWithInvite()
  const servers = await makeMembershipsContext()
  const hook = new SignUpHook(consume, settle, servers.join, servers.resolve, servers.events)
  return { hook, invites, servers }
}
