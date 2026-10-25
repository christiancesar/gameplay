import { describe, expect, it } from 'vitest'

import { needsSwitchConfirmation } from './needs-switch-confirmation'

describe('needsSwitchConfirmation', () => {
  it('does not ask when there is no voice connection', () => {
    expect(needsSwitchConfirmation(null, 's2')).toBe(false)
  })

  it('asks when connected to a room of another server', () => {
    expect(needsSwitchConfirmation({ serverId: 's1', roomId: 'r1' }, 's2')).toBe(true)
  })

  it('does not ask when the target is the server already connected', () => {
    expect(needsSwitchConfirmation({ serverId: 's1', roomId: 'r1' }, 's1')).toBe(false)
  })
})
