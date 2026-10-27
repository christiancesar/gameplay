import type { z } from 'zod'

/** Adds an issue for each key left empty, explaining when it is required. */
export function requireKeys<T extends object>(
  env: T,
  ctx: z.RefinementCtx,
  keys: readonly (keyof T & string)[],
  when: string,
): void {
  for (const key of keys) {
    if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: `Required when ${when}` })
  }
}

/** Cloudflare Realtime TURN needs its key whenever it is the ICE provider. */
export function cloudflareTurnRule(
  env: { ICE_PROVIDER: string; CLOUDFLARE_TURN_KEY_ID?: string; CLOUDFLARE_TURN_API_TOKEN?: string },
  ctx: z.RefinementCtx,
): void {
  if (env.ICE_PROVIDER === 'cloudflare') {
    requireKeys(env, ctx, ['CLOUDFLARE_TURN_KEY_ID', 'CLOUDFLARE_TURN_API_TOKEN'], 'ICE_PROVIDER is cloudflare')
  }
}

/** Every invalid variable, one per line, for a startup error. */
export function describeIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `- ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n')
}
