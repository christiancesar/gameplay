import type { RegistrationInvite } from '@gameplay/contracts'

import type { RegistrationKeyItem } from '@/modules/admin/views/keys-tab.view'

function toRegistrationKeyItem(invite: RegistrationInvite): RegistrationKeyItem {
  const status: RegistrationKeyItem['status'] =
    invite.status === 'used' ? { type: 'used', userName: invite.usedBy?.username ?? '' } : { type: invite.status }
  return { id: invite.id, hint: invite.suffix, createdAt: invite.createdAt, expiresAt: invite.expiresAt, status }
}

export { toRegistrationKeyItem }
