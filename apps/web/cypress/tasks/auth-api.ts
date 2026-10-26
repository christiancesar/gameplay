import { randomInt } from 'node:crypto'

const WEB_ORIGIN = 'http://localhost:5173'

type AuthResponse = { status: number; body: Record<string, unknown>; cookies: string }

/** Better Auth rate limits by IP; a fake one per call keeps a long run under the limits. */
function fakeIp(): string {
  return `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`
}

/** Calls the real auth API through the Vite proxy, like the browser does. */
async function postAuth(path: string, body: object, cookies = ''): Promise<AuthResponse> {
  const response = await fetch(`${WEB_ORIGIN}/api/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN, 'x-forwarded-for': fakeIp(), cookie: cookies },
    body: JSON.stringify(body),
  })
  const received = response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ')
  const text = await response.text()
  return {
    status: response.status,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
    cookies: [cookies, received].filter(Boolean).join('; '),
  }
}

export { fakeIp, postAuth, WEB_ORIGIN }
export type { AuthResponse }
