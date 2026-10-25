import type { AdminSession, AdminUser } from '@gameplay/contracts'

import type { AdminSessionItem } from '@/modules/admin/views/sessions-dialog.view'
import type { AdminUserItem } from '@/modules/admin/views/users-tab.view'

import { summarizeUserAgent } from '../rules/summarize-user-agent'

function displayName(user: Pick<AdminUser, 'displayUsername' | 'username'>): string {
  return user.displayUsername ?? user.username
}

function toAdminUserItem(user: AdminUser): AdminUserItem {
  return {
    id: user.id,
    name: displayName(user),
    email: user.email,
    avatarUrl: user.image ?? undefined,
    isOnline: user.online,
    isSuspended: user.suspended,
    isPlatformAdmin: user.role === 'admin',
    sessionCount: user.sessionCount,
    serverLimit: { value: user.effectiveMaxServers, isOverride: user.maxServersOverride !== null },
    serversOwned: user.ownedServerCount,
  }
}

/** `isActiveNow` stays false: "last active" is a refresh time, not presence, and the View has no safe cutoff. */
function toAdminSessionItem(session: AdminSession): AdminSessionItem {
  return {
    id: session.id,
    ip: session.ipAddress ?? '–',
    device: summarizeUserAgent(session.userAgent),
    lastActiveAt: session.lastActiveAt,
    isActiveNow: false,
  }
}

export { displayName, toAdminSessionItem, toAdminUserItem }
