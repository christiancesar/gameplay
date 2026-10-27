import { describe, expect, it } from 'vitest'
import { validateApiEnv } from './api.js'

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
const required = {
  DATABASE_URL,
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  REGISTRATION_KEY_SECRET: 'b'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3333',
}

describe('validateApiEnv', () => {
  it('applies the defaults', () => {
    expect(validateApiEnv(required)).toEqual({
      ...required,
      NODE_ENV: 'development',
      PORT: 3333,
      LOG_LEVEL: 'info',
      WEB_ORIGIN: 'http://localhost:5173',
      STORAGE_DRIVER: 'local',
      STORAGE_LOCAL_DIR: './uploads',
      PUBLIC_UPLOADS_URL: '/uploads',
      S3_REGION: 'auto',
      S3_FORCE_PATH_STYLE: false,
      TRUST_PROXY_HOPS: 0,
      ICE_PROVIDER: 'stun-only',
      STUN_URLS: ['stun:stun.cloudflare.com:3478'],
      ICE_TTL_SECONDS: 86_400,
      ROOM_RECONNECT_GRACE_MS: 30_000,
    })
  })

  it('requires the credentials of the chosen ICE provider', () => {
    expect(() => validateApiEnv({ ...required, ICE_PROVIDER: 'cloudflare' })).toThrow(/CLOUDFLARE_TURN_KEY_ID/)
    expect(() => validateApiEnv({ ...required, ICE_PROVIDER: 'coturn' })).toThrow(/COTURN_URLS[\s\S]*COTURN_SECRET/)
  })

  it('splits the coturn URL list', () => {
    const env = validateApiEnv({
      ...required,
      ICE_PROVIDER: 'coturn',
      COTURN_URLS: 'turn:a:3478?transport=udp, turn:a:3478?transport=tcp',
      COTURN_SECRET: 's'.repeat(16),
    })

    expect(env.COTURN_URLS).toEqual(['turn:a:3478?transport=udp', 'turn:a:3478?transport=tcp'])
  })

  it('requires the bucket and credentials for the s3 driver', () => {
    expect(() => validateApiEnv({ ...required, STORAGE_DRIVER: 's3' })).toThrow(/S3_BUCKET[\s\S]*S3_ACCESS_KEY_ID/)
    expect(
      validateApiEnv({
        ...required,
        STORAGE_DRIVER: 's3',
        S3_BUCKET: 'uploads',
        S3_ACCESS_KEY_ID: 'id',
        S3_SECRET_ACCESS_KEY: 'secret',
      }).STORAGE_DRIVER,
    ).toBe('s3')
  })

  it('coerces the port from the string the environment provides', () => {
    expect(validateApiEnv({ ...required, PORT: '4000' }).PORT).toBe(4000)
  })

  it('fails listing the missing variable', () => {
    expect(() => validateApiEnv({})).toThrow(/DATABASE_URL/)
  })

  it('rejects a short auth secret', () => {
    expect(() => validateApiEnv({ ...required, BETTER_AUTH_SECRET: 'short' })).toThrow(/BETTER_AUTH_SECRET/)
  })

  it('rejects a database url that is not postgres', () => {
    expect(() => validateApiEnv({ ...required, DATABASE_URL: 'mysql://localhost/db' })).toThrow(/DATABASE_URL/)
  })
})
