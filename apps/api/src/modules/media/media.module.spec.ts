import type { EnvService } from '../../env/env.service'
import { createSfuProvider } from './media.module'
import { CloudflareSfuProvider } from './providers/sfu/cloudflare/cloudflare.sfu.provider'
import { NotConfiguredSfuProvider } from './providers/sfu/not-configured/not-configured.sfu.provider'

function env(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as unknown as EnvService
}

describe('createSfuProvider', () => {
  it('uses Cloudflare when both variables are set', () => {
    const provider = createSfuProvider(env({ CLOUDFLARE_SFU_APP_ID: 'app', CLOUDFLARE_SFU_APP_TOKEN: 'token' }))
    expect(provider).toBeInstanceOf(CloudflareSfuProvider)
  })

  it('is off when one is missing or empty', () => {
    expect(createSfuProvider(env({ CLOUDFLARE_SFU_APP_ID: 'app' }))).toBeInstanceOf(NotConfiguredSfuProvider)
    expect(createSfuProvider(env({ CLOUDFLARE_SFU_APP_ID: '', CLOUDFLARE_SFU_APP_TOKEN: 'token' })).configured).toBe(
      false,
    )
  })
})
