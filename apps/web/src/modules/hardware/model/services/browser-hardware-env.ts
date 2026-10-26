import type { HardwareEnv, NavigatorLike } from '@/modules/hardware/model/services/hardware-collector.service'
import { displays } from '@/modules/hardware/model/services/displays.service'

/** WebGL's unmasked strings name the real GPU ("ANGLE (NVIDIA ...)"); the plain ones are masked. */
function readGpu() {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')
  if (!gl || !(gl instanceof WebGLRenderingContext)) return null
  const extension = gl.getExtension('WEBGL_debug_renderer_info')
  if (!extension) return null
  const text = (parameter: number) => {
    const value: unknown = gl.getParameter(parameter)
    return typeof value === 'string' && value !== '' ? value : null
  }
  return { vendor: text(extension.UNMASKED_VENDOR_WEBGL), renderer: text(extension.UNMASKED_RENDERER_WEBGL) }
}

/** The real browser behind the collector. Thin glue, covered by the collector spec through its fake. */
const browserHardwareEnv: HardwareEnv = {
  get navigator() {
    return navigator as unknown as NavigatorLike
  },
  readGpu,
  readScreens: () => displays.readScreens(),
}

export { browserHardwareEnv }
