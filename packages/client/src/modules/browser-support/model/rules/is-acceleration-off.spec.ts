import { describe, expect, it } from 'vitest'

import { isAccelerationOff } from './is-acceleration-off'

describe('isAccelerationOff', () => {
  it.each([
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)',
    'Mesa llvmpipe (LLVM 15.0.7, 256 bits)',
    'Microsoft Basic Render Driver',
  ])('is true for the software renderer %s', (renderer) => {
    expect(isAccelerationOff({ webgl: true, renderer })).toBe(true)
  })

  it('is true when WebGL is unavailable', () => {
    expect(isAccelerationOff({ webgl: false, renderer: null })).toBe(true)
  })

  it('is false for a real GPU', () => {
    expect(isAccelerationOff({ webgl: true, renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11)' })).toBe(
      false,
    )
  })

  it('is false when the renderer is unknown', () => {
    expect(isAccelerationOff({ webgl: true, renderer: null })).toBe(false)
  })
})
