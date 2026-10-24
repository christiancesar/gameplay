import { validateEnv } from './env.schema'

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
const required = {
  DATABASE_URL,
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3333',
}

describe('validateEnv', () => {
  it('applies the defaults', () => {
    expect(validateEnv(required)).toEqual({
      ...required,
      NODE_ENV: 'development',
      PORT: 3333,
      LOG_LEVEL: 'info',
      WEB_ORIGIN: 'http://localhost:5173',
    })
  })

  it('coerces the port from the string the environment provides', () => {
    expect(validateEnv({ ...required, PORT: '4000' }).PORT).toBe(4000)
  })

  it('fails listing the missing variable', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/)
  })

  it('rejects a short auth secret', () => {
    expect(() => validateEnv({ ...required, BETTER_AUTH_SECRET: 'short' })).toThrow(/BETTER_AUTH_SECRET/)
  })

  it('rejects a database url that is not postgres', () => {
    expect(() => validateEnv({ ...required, DATABASE_URL: 'mysql://localhost/db' })).toThrow(/DATABASE_URL/)
  })
})
