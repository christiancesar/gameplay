type GpuInfo = {
  /** False when no WebGL context could be created. */
  webgl: boolean
  /** Unmasked renderer, null when the debug extension is missing. */
  renderer: string | null
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i

/** No WebGL, or a software renderer. An unknown renderer is not enough to warn. */
function isAccelerationOff(gpu: GpuInfo): boolean {
  if (!gpu.webgl) return true
  return gpu.renderer !== null && SOFTWARE_RENDERER.test(gpu.renderer)
}

export { isAccelerationOff }
export type { GpuInfo }
