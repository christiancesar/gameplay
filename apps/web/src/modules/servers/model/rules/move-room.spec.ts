import { describe, expect, it } from 'vitest'

import { moveRoom } from './move-room'

const ids = ['a', 'b', 'c']

describe('moveRoom', () => {
  it('swaps with the room above', () => {
    expect(moveRoom(ids, 'b', 'up')).toEqual(['b', 'a', 'c'])
  })

  it('swaps with the room below', () => {
    expect(moveRoom(ids, 'b', 'down')).toEqual(['a', 'c', 'b'])
  })

  it('does nothing at the ends or for an unknown room', () => {
    expect(moveRoom(ids, 'a', 'up')).toBeUndefined()
    expect(moveRoom(ids, 'c', 'down')).toBeUndefined()
    expect(moveRoom(ids, 'x', 'down')).toBeUndefined()
  })

  it('does not change the input', () => {
    moveRoom(ids, 'b', 'up')
    expect(ids).toEqual(['a', 'b', 'c'])
  })
})
