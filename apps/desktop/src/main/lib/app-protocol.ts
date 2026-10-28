import { stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'

import { APP_HOST, APP_SCHEME } from '../utils/app-url'
import { looksLikeFile, resolveAssetPath } from '../utils/asset-path'
import { uploadsUrl } from '../utils/uploads-url'

/** Before the app is ready: makes `app://` a scheme like https (fetch, cookies, storage per origin). */
function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
  ])
}

async function isFile(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isFile()
  } catch {
    return false
  }
}

/**
 * Serves the built front-end on `app://gameplay/`, with the entry page for any route that is not a file, and asks
 * the server (`currentServer`) for the images and files under `/uploads/`. Every page carries the given policy.
 */
function serveApp(root: string, currentServer: () => string | null, contentSecurityPolicy: string): void {
  protocol.handle(APP_SCHEME, async (request) => {
    const { host, pathname } = new URL(request.url)
    if (host !== APP_HOST) return new Response('Not found', { status: 404 })
    if (pathname.startsWith('/uploads/')) {
      const upstream = request.method === 'GET' ? uploadsUrl(currentServer(), request.url) : null
      return upstream ? net.fetch(upstream) : new Response('Not found', { status: 404 })
    }
    const target = resolveAssetPath(root, pathname)
    if (!target) return new Response('Bad request', { status: 400 })

    const file = (await isFile(target)) ? target : looksLikeFile(pathname) ? null : path.join(root, 'index.html')
    if (!file) return new Response('Not found', { status: 404 })

    const response = await net.fetch(pathToFileURL(file).toString())
    if (!file.endsWith('.html')) return response
    const headers = new Headers(response.headers)
    headers.set('Content-Security-Policy', contentSecurityPolicy)
    return new Response(response.body, { status: response.status, headers })
  })
}

export { registerAppScheme, serveApp }
