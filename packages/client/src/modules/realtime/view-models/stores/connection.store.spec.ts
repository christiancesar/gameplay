import { beforeEach, describe, expect, it } from 'vitest'

import { useConnectionStore } from './connection.store'

describe('connection store', () => {
  beforeEach(() => useConnectionStore.getState().reset())

  it('starts disconnected', () => {
    expect(useConnectionStore.getState()).toMatchObject({ status: 'disconnected', recovered: false })
  })

  it('does not flag recovery on the first connection', () => {
    useConnectionStore.getState().setStatus('connected')
    expect(useConnectionStore.getState()).toMatchObject({ status: 'connected', recovered: false })
  })

  it('flags recovery when it connects again after reconnecting', () => {
    const { setStatus } = useConnectionStore.getState()
    setStatus('connected')
    setStatus('reconnecting')
    setStatus('connected')
    expect(useConnectionStore.getState().recovered).toBe(true)
  })

  it('clears the recovery flag on dismiss and on the next change', () => {
    const { setStatus, dismissRecovered } = useConnectionStore.getState()
    setStatus('reconnecting')
    setStatus('connected')
    dismissRecovered()
    expect(useConnectionStore.getState().recovered).toBe(false)
    setStatus('reconnecting')
    setStatus('connected')
    setStatus('disconnected')
    expect(useConnectionStore.getState().recovered).toBe(false)
  })
})
