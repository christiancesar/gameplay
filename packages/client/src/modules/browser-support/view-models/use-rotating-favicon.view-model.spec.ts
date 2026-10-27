import { renderHook } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FAVICON_ICONS, iconToDataUrl } from '../model/services/favicon.service'
import { ROTATION_INTERVAL_MS, useRotatingFaviconViewModel } from './use-rotating-favicon.view-model'

const href = () => document.head.querySelector('link[rel~="icon"]')?.getAttribute('href')
const expected = (index: number) => iconToDataUrl(FAVICON_ICONS[index])

function stubReducedMotion(initial: boolean) {
  let listener: (() => void) | undefined
  const query = {
    matches: initial,
    addEventListener: (_type: string, callback: () => void) => (listener = callback),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', () => query)
  return {
    set: (value: boolean) => {
      query.matches = value
      listener?.()
    },
  }
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useRotatingFaviconViewModel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.head.innerHTML = '<link rel="icon" href="/favicon.svg" />'
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts on the first icon and rotates every interval', () => {
    stubReducedMotion(false)
    renderHook(() => useRotatingFaviconViewModel())
    expect(href()).toBe(expected(0))
    act(() => vi.advanceTimersByTime(ROTATION_INTERVAL_MS))
    expect(href()).toBe(expected(1))
    act(() => vi.advanceTimersByTime(ROTATION_INTERVAL_MS))
    expect(href()).toBe(expected(2))
  })

  it('wraps around after the last icon', () => {
    stubReducedMotion(false)
    renderHook(() => useRotatingFaviconViewModel())
    act(() => vi.advanceTimersByTime(ROTATION_INTERVAL_MS * FAVICON_ICONS.length))
    expect(href()).toBe(expected(0))
  })

  it('pauses while the tab is hidden and resumes when it is visible again', () => {
    stubReducedMotion(false)
    renderHook(() => useRotatingFaviconViewModel())
    act(() => setHidden(true))
    act(() => vi.advanceTimersByTime(ROTATION_INTERVAL_MS * 3))
    expect(href()).toBe(expected(0))
    act(() => setHidden(false))
    act(() => vi.advanceTimersByTime(ROTATION_INTERVAL_MS))
    expect(href()).toBe(expected(1))
  })

  it('does not rotate with reduced motion, and starts if the preference changes', () => {
    const motion = stubReducedMotion(true)
    renderHook(() => useRotatingFaviconViewModel())
    act(() => vi.advanceTimersByTime(ROTATION_INTERVAL_MS * 3))
    expect(href()).toBe(expected(0))
    act(() => motion.set(false))
    act(() => vi.advanceTimersByTime(ROTATION_INTERVAL_MS))
    expect(href()).toBe(expected(1))
  })

  it('stops rotating on unmount', () => {
    stubReducedMotion(false)
    const { unmount } = renderHook(() => useRotatingFaviconViewModel())
    unmount()
    act(() => vi.advanceTimersByTime(ROTATION_INTERVAL_MS * 3))
    expect(href()).toBe(expected(0))
  })
})
