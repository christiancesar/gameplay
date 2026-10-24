import { validateEnv } from './env.schema'

const DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'

describe('validateEnv', () => {
  it('applies the defaults', () => {
    expect(validateEnv({ DATABASE_URL })).toEqual({
      NODE_ENV: 'development',
      PORT: 3333,
      LOG_LEVEL: 'info',
      DATABASE_URL,
    })
  })

  it('coerces the port from the string the environment provides', () => {
    expect(validateEnv({ DATABASE_URL, PORT: '4000' }).PORT).toBe(4000)
  })

  it('fails listing the missing variable', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/)
  })

  it('rejects a database url that is not postgres', () => {
    expect(() => validateEnv({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(/DATABASE_URL/)
  })
})
