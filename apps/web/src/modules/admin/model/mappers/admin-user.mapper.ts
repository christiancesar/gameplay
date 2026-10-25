import type { AdminSession, AdminUser } from '@gameplay/contracts'

import type { AdminSessionItem } from '@/modules/admin/views/sessions-dialog.view'
import type { AdminUserItem } from '@/modules/admin/views/users-tab.view'

import { summarizeUserAgent } from '../rules/summarize-user-agent'

/** What the admin list does not carry: the API has no per-user counts or limit override, so the ViewModel gathers them. */
type AdminUserContext = {
  sessionCount: number
  serversOwned: number
  defaultServerLimit: number
  /** Override set from this panel, when known. */
  serverLimitOverride?: number
}

function displayName(user: Pick<AdminUser, 'displayUsername' | 'username'>): string {
  return user.displayUsername ?? user.username
}

function toAdminUserItem(user: AdminUser, context: AdminUserContext): AdminUserItem {
  const override = context.serverLimitOverride
  return {
    id: user.id,
    name: displayName(user),
    email: user.email,
    avatarUrl: user.image ?? undefined,
    isOnline: user.online,
    isSuspended: user.suspended,
    isPlatformAdmin: user.role === 'admin',
    sessionCount: context.sessionCount,
    serverLimit: { value: override ?? context.defaultServerLimit, isOverride: override !== undefined },
    serversOwned: context.serversOwned,
  }
}

/** The API gives the creation time only, so no session is marked as active right now. */
function toAdminSessionItem(session: AdminSession): AdminSessionItem {
  return {
    id: session.id,
    ip: session.ipAddress ?? '–',
    device: summarizeUserAgent(session.userAgent),
    lastActiveAt: session.createdAt,
    isActiveNow: false,
  }
}

export { displayName, toAdminSessionItem, toAdminUserItem }
export type { AdminUserContext }
