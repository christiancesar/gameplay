import type { GpuInfo } from '@/modules/browser-support/model/rules/is-acceleration-off'

type WebGlLike = {
  getExtension: (name: string) => { UNMASKED_RENDERER_WEBGL: number } | null
  getParameter: (parameter: number) => unknown
}

/** Creates a WebGL context, or null when the browser cannot. Tests pass a fake. */
type WebGlFactory = () => WebGlLike | null

function createGpuInfoReader(createContext: WebGlFactory): () => GpuInfo {
  return () => {
    let gl: WebGlLike | null = null
    try {
      gl = createContext()
    } catch {
      gl = null
    }
    if (!gl) return { webgl: false, renderer: null }
    const extension = gl.getExtension('WEBGL_debug_renderer_info')
    const value: unknown = extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : null
    return { webgl: true, renderer: typeof value === 'string' && value !== '' ? value : null }
  }
}

export { createGpuInfoReader }
export type { WebGlFactory, WebGlLike }
