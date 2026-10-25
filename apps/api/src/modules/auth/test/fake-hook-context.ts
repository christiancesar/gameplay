import type { AuthHookContext } from '@thallesp/nestjs-better-auth'

// What a Better Auth hook receives for a sign-up: the request body and, in
// the after hook, the session of the account just created.
export function fakeHookContext(body: Record<string, unknown>, newUserId?: string): AuthHookContext {
  const newSession = newUserId ? { user: { id: newUserId } } : null
  return { body, context: { newSession } } as unknown as AuthHookContext
}
