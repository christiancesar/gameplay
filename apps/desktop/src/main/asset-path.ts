import path from 'node:path'

/**
 * The file of the built front-end that a request for `pathname` asks for, or null when the path tries to leave
 * the build folder. `/` is the entry page.
 */
function resolveAssetPath(root: string, pathname: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  if (decoded.includes('\0')) return null
  const target = path.resolve(root, `.${decoded.endsWith('/') ? `${decoded}index.html` : decoded}`)
  return target === root || target.startsWith(`${root}${path.sep}`) ? target : null
}

/** A path like /assets/app.js is a file; /servers/abc is a route of the front-end. */
function looksLikeFile(pathname: string): boolean {
  return path.extname(pathname) !== ''
}

export { looksLikeFile, resolveAssetPath }
