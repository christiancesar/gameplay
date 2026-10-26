import { describe, expect, it } from 'vitest'

import { createGpuInfoReader, type WebGlLike } from './gpu-info.service'

const gl = (renderer: unknown, hasExtension = true): WebGlLike => ({
  getExtension: () => (hasExtension ? { UNMASKED_RENDERER_WEBGL: 37446 } : null),
  getParameter: () => renderer,
})

describe('createGpuInfoReader', () => {
  it('reads the unmasked renderer', () => {
    expect(createGpuInfoReader(() => gl('Mesa llvmpipe'))()).toEqual({ webgl: true, renderer: 'Mesa llvmpipe' })
  })

  it('reports WebGL without a renderer when the extension is missing', () => {
    expect(createGpuInfoReader(() => gl('x', false))()).toEqual({ webgl: true, renderer: null })
  })

  it('ignores a renderer that is not a string', () => {
    expect(createGpuInfoReader(() => gl(''))()).toEqual({ webgl: true, renderer: null })
  })

  it('reports no WebGL when there is no context or creating it throws', () => {
    expect(createGpuInfoReader(() => null)()).toEqual({ webgl: false, renderer: null })
    expect(
      createGpuInfoReader(() => {
        throw new Error('blocked')
      })(),
    ).toEqual({ webgl: false, renderer: null })
  })
})
