import { adminClient, inferAdditionalFields, twoFactorClient, usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { currentPlatform } from '@/shared/platform/current-platform'

/**
 * O client lê a origem da página como a da API e recusa uma que não seja http(s), como `app://` no desktop. O endereço
 * de verdade entra a cada chamada (`toServerUrl`), então fora do http(s) um endereço qualquer ocupa o lugar.
 */
function placeholderBaseUrl(pageOrigin: string): string | undefined {
  return /^https?:\/\//.test(pageOrigin) ? undefined : 'https://server.invalid'
}

/** O mesmo caminho no servidor da plataforma: o client monta a URL no domínio da página, aqui ela troca de domínio. */
function toServerUrl(input: Parameters<typeof fetch>[0]): Parameters<typeof fetch>[0] {
  const base = currentPlatform().server.baseUrl()
  if (!base) return input
  const url = new URL(input instanceof Request ? input.url : String(input))
  return new URL(`${url.pathname}${url.search}`, base).toString()
}

/**
 * Client do Better Auth. As rotas ficam em /api/auth. No web é o mesmo domínio e a sessão é um cookie (padrão do
 * client). No desktop as chamadas vão ao servidor escolhido com o token no header Authorization: o login devolve o
 * token no header `set-auth-token`, o logout o apaga. A plataforma é lida a cada chamada, porque só existe depois
 * que o app monta.
 */
const authClient = createAuthClient({
  baseURL: placeholderBaseUrl(globalThis.location?.origin ?? ''),
  fetchOptions: {
    customFetchImpl: (input, init) => fetch(toServerUrl(input), init),
    auth: { type: 'Bearer', token: () => currentPlatform().server.session.getToken() ?? '' },
    onSuccess: ({ response }) => {
      const { session } = currentPlatform().server
      if (response.url.endsWith('/sign-out')) return session.clearToken()
      const token = response.headers.get('set-auth-token')
      if (token) session.setToken(token)
    },
  },
  plugins: [
    usernameClient(),
    twoFactorClient(),
    adminClient(),
    // Campos extras do user na API (apps/api/src/lib/auth.ts).
    inferAdditionalFields({
      user: {
        avatarKey: { type: 'string', required: false, input: false },
        theme: { type: 'string', required: false, input: false },
        locale: { type: 'string', required: false, input: false },
        maxServersOverride: { type: 'number', required: false, input: false },
      },
    }),
  ],
})

type AuthSession = typeof authClient.$Infer.Session

export { authClient, placeholderBaseUrl }
export type { AuthSession }
