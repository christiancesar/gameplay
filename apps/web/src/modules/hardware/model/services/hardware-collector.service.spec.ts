import { describe, expect, it } from 'vitest'

import { chromiumEnv } from '../../view-models/test/hardware-seed'

import { createHardwareCollector, pickBrowser } from './hardware-collector.service'

describe('pickBrowser', () => {
  it('prefers a named brand over Chromium and skips the grease entry', () => {
    expect(
      pickBrowser([
        { brand: 'Not.A/Brand', version: '8' },
        { brand: 'Chromium', version: '141' },
        { brand: 'Microsoft Edge', version: '141' },
      ]),
    ).toEqual({ brand: 'Microsoft Edge', version: '141' })
  })

  it('falls back to Chromium, then to null', () => {
    expect(pickBrowser([{ brand: 'Chromium', version: '141' }])).toEqual({ brand: 'Chromium', version: '141' })
    expect(pickBrowser(undefined)).toEqual({ brand: null, version: null })
  })
})

describe('hardware collector', () => {
  it('collects everything a Chromium browser exposes', async () => {
    const collected = await createHardwareCollector(chromiumEnv()).collect({ withDisplays: true })
    expect(collected).toEqual({
      os: { platform: 'Windows', version: '15.0.0', architecture: 'x86', bitness: '64' },
      browser: { brand: 'Google Chrome', version: '141' },
      logicalCores: 16,
      deviceMemoryGb: 8,
      gpu: {
        vendor: 'Google Inc. (NVIDIA)',
        renderer: 'ANGLE (NVIDIA GeForce RTX 3070)',
        hardwareAcceleration: true,
        webgpu: true,
      },
      videoEncoding: {
        h264: { supported: true, smooth: true, powerEfficient: true },
        vp9: { supported: true, smooth: true, powerEfficient: false },
        av1: { supported: false, smooth: false, powerEfficient: false },
      },
      network: { effectiveType: '4g', downlinkMbps: 10, rttMs: 50, saveData: false },
      displays: [
        {
          label: 'LG 27GL850',
          width: 2560,
          height: 1440,
          scaleFactor: 1,
          refreshRate: null,
          isPrimary: true,
          isInternal: false,
        },
      ],
    })
  })

  it('leaves displays null unless asked, without touching the screens API', async () => {
    const env = chromiumEnv()
    let called = false
    env.readScreens = async () => ((called = true), [])
    const collected = await createHardwareCollector(env).collect({ withDisplays: false })
    expect(collected.displays).toBeNull()
    expect(called).toBe(false)
  })

  it('reports null for a failed screens read', async () => {
    const env = chromiumEnv()
    env.readScreens = async () => {
      throw new Error('denied')
    }
    expect((await createHardwareCollector(env).collect({ withDisplays: true })).displays).toBeNull()
  })

  it('degrades to nulls in a browser that exposes nothing (Firefox-like)', async () => {
    const collected = await createHardwareCollector({
      navigator: {},
      readGpu: () => null,
      readScreens: async () => [],
    }).collect({ withDisplays: false })
    expect(collected).toEqual({
      os: { platform: null, version: null, architecture: null, bitness: null },
      browser: { brand: null, version: null },
      logicalCores: null,
      deviceMemoryGb: null,
      gpu: { vendor: null, renderer: null, hardwareAcceleration: null, webgpu: false },
      videoEncoding: { h264: null, vp9: null, av1: null },
      network: { effectiveType: null, downlinkMbps: null, rttMs: null, saveData: null },
      displays: null,
    })
  })

  it('flags software rendering', async () => {
    const env = chromiumEnv()
    env.readGpu = () => ({ vendor: 'Google Inc.', renderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))' })
    expect((await createHardwareCollector(env).collect({ withDisplays: false })).gpu.hardwareAcceleration).toBe(false)
  })

  it('survives a throwing capability read', async () => {
    const env = chromiumEnv()
    env.navigator.userAgentData!.getHighEntropyValues = async () => {
      throw new Error('blocked')
    }
    env.readGpu = () => {
      throw new Error('no webgl')
    }
    const collected = await createHardwareCollector(env).collect({ withDisplays: false })
    expect(collected.os).toEqual({ platform: 'Windows', version: null, architecture: null, bitness: null })
    expect(collected.gpu.renderer).toBeNull()
  })

  it('rounds fractional screen sizes to integers', async () => {
    const env = chromiumEnv()
    env.readScreens = async () => [{ width: 1536.4, height: 864.2, devicePixelRatio: 1.25 }]
    const collected = await createHardwareCollector(env).collect({ withDisplays: true })
    expect(collected.displays).toEqual([
      {
        label: null,
        width: 1536,
        height: 864,
        scaleFactor: 1.25,
        refreshRate: null,
        isPrimary: null,
        isInternal: null,
      },
    ])
  })
})
