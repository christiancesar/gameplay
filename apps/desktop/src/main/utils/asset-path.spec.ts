import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { looksLikeFile, resolveAssetPath } from './asset-path'

const root = path.resolve('/app/renderer')

describe('resolveAssetPath', () => {
  it('maps the root to the entry page and a path to its file', () => {
    expect(resolveAssetPath(root, '/')).toBe(path.join(root, 'index.html'))
    expect(resolveAssetPath(root, '/assets/app.js')).toBe(path.join(root, 'assets', 'app.js'))
  })

  it('refuses a path that leaves the build folder', () => {
    expect(resolveAssetPath(root, '/../secret.txt')).toBeNull()
    expect(resolveAssetPath(root, '/assets/../../secret.txt')).toBeNull()
    expect(resolveAssetPath(root, '/%2e%2e/secret.txt')).toBeNull()
    expect(resolveAssetPath(root, '/a%00b')).toBeNull()
    expect(resolveAssetPath(root, '/%E0%A4%A')).toBeNull()
  })
})

describe('looksLikeFile', () => {
  it('tells an asset from a route', () => {
    expect(looksLikeFile('/assets/app.js')).toBe(true)
    expect(looksLikeFile('/servers/abc')).toBe(false)
    expect(looksLikeFile('/')).toBe(false)
  })
})
