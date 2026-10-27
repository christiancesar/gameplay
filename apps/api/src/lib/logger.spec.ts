import { requestLogLevel } from './logger'

describe('requestLogLevel', () => {
  it('logs server errors as error, client errors as warn and the rest as info', () => {
    expect(requestLogLevel(500)).toBe('error')
    expect(requestLogLevel(503)).toBe('error')
    expect(requestLogLevel(404)).toBe('warn')
    expect(requestLogLevel(401)).toBe('warn')
    expect(requestLogLevel(200)).toBe('info')
    expect(requestLogLevel(304)).toBe('info')
  })

  it('logs a request that failed with an error as error, whatever the status', () => {
    expect(requestLogLevel(200, new Error('socket hang up'))).toBe('error')
  })
})
