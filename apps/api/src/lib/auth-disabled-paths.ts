import type { BetterAuthPlugin } from 'better-auth'

// Better Auth routes the app doesn't use. They answer 404 over HTTP and are
// left out of the auth OpenAPI; server-side calls (auth.api.*) still work.
export const DISABLED_AUTH_PATHS = [
  // Platform admin actions go through our own routes (BE-15), which require
  // two-factor and publish domain events. Admins come only from the seed.
  '/admin/ban-user',
  '/admin/create-user',
  '/admin/get-user',
  '/admin/has-permission',
  '/admin/impersonate-user',
  '/admin/list-user-sessions',
  '/admin/list-users',
  '/admin/remove-user',
  '/admin/revoke-user-session',
  '/admin/revoke-user-sessions',
  '/admin/set-role',
  '/admin/set-user-password',
  '/admin/stop-impersonating',
  '/admin/unban-user',
  '/admin/update-user',
  // No self-service account deletion.
  '/delete-user',
  '/delete-user/callback',
  // No email flows: no verification, no forgot-password, no email change.
  '/request-password-reset',
  '/reset-password',
  '/send-verification-email',
  '/verify-email',
  '/change-email',
  // No social login.
  '/sign-in/social',
  '/link-social',
  '/unlink-account',
  '/get-access-token',
  '/refresh-token',
  // Two-factor is TOTP only.
  '/two-factor/send-otp',
  '/two-factor/verify-otp',
]

// disabledPaths matches the exact path, so routes with a path param
// (/reset-password/:token, /callback/:id) need a prefix check.
const DISABLED_AUTH_PREFIXES = ['/reset-password/', '/callback/']

export function disabledAuthPrefixes(basePath: string): BetterAuthPlugin {
  return {
    id: 'disabled-auth-prefixes',
    onRequest: async (request) => {
      const path = new URL(request.url).pathname.slice(basePath.length)
      if (DISABLED_AUTH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
        return { response: new Response('Not Found', { status: 404 }) }
      }
    },
  }
}
