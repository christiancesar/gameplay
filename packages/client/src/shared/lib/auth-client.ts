import { adminClient, inferAdditionalFields, twoFactorClient, usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

/** Client do Better Auth. As rotas ficam em /api/auth no mesmo domínio (padrão do client). */
const authClient = createAuthClient({
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

export { authClient }
export type { AuthSession }
