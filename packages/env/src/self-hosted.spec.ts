import { describe, expect, it } from 'vitest'
import { selfHostedEnvSchema } from './self-hosted.js'
import { QUICK_MODE_ENV } from './test/self-hosted-seed.js'

const issueKeys = (env: Record<string, unknown>) =>
  selfHostedEnvSchema.safeParse(env).error?.issues.map((issue) => issue.path.join('.')) ?? []

describe('selfHostedEnvSchema', () => {
  it('applies the defaults of the stack', () => {
    const env = selfHostedEnvSchema.parse(QUICK_MODE_ENV)

    expect(env).toMatchObject({
      TUNNEL_MODE: 'quick',
      ICE_PROVIDER: 'cloudflare',
      WEB_PORT: 8080,
      POSTGRES_HOST_PORT: 5433,
      CLOUDFLARED_METRICS_PORT: 20241,
      LOG_LEVEL: 'info',
    })
  })

  it('runs locally when no tunnel is chosen', () => {
    const { TUNNEL_MODE: _, ...withoutMode } = QUICK_MODE_ENV

    expect(selfHostedEnvSchema.parse(withoutMode).TUNNEL_MODE).toBe('local')
  })

  it('asks for the TURN key while ICE_PROVIDER is cloudflare', () => {
    const { CLOUDFLARE_TURN_KEY_ID: _, CLOUDFLARE_TURN_API_TOKEN: __, ...withoutTurn } = QUICK_MODE_ENV

    expect(issueKeys(withoutTurn)).toEqual(['CLOUDFLARE_TURN_KEY_ID', 'CLOUDFLARE_TURN_API_TOKEN'])
    expect(issueKeys({ ...withoutTurn, ICE_PROVIDER: 'stun-only' })).toEqual([])
  })

  it('asks for the hostname and tunnel of named mode', () => {
    expect(issueKeys({ ...QUICK_MODE_ENV, TUNNEL_MODE: 'named' })).toEqual([
      'APP_URL',
      'CLOUDFLARE_TUNNEL_ID',
      'CLOUDFLARE_TUNNEL_CREDENTIALS',
    ])
  })

  it('asks for the hostname and token of token mode', () => {
    expect(issueKeys({ ...QUICK_MODE_ENV, TUNNEL_MODE: 'token' })).toEqual(['APP_URL', 'CLOUDFLARE_TUNNEL_TOKEN'])
  })

  it('refuses short secrets and an invalid admin', () => {
    expect(
      issueKeys({ ...QUICK_MODE_ENV, BETTER_AUTH_SECRET: 'short', ADMIN_EMAIL: 'not-an-email', WEB_PORT: 'eighty' }),
    ).toEqual(['BETTER_AUTH_SECRET', 'ADMIN_EMAIL', 'WEB_PORT'])
  })
})
