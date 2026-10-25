import { PASSWORD_MIN_LENGTH, USERNAME_PATTERN } from '@gameplay/contracts'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, openAPI, twoFactor, username } from 'better-auth/plugins'
import { isDocsEnabled } from '../docs/docs-enabled'
import type { EnvService } from '../env/env.service'
import { DISABLED_AUTH_PATHS, disabledAuthPrefixes } from './auth-disabled-paths'
import type { PrismaService } from './prisma'

// Better Auth instance. Built by AuthenticationModule with the app's Prisma
// client and env; its routes are served under /api/auth.
const BASE_PATH = '/api/auth'

export function createAuth(prisma: PrismaService, env: EnvService) {
  return betterAuth({
    appName: 'Gameplay',
    baseURL: env.get('BETTER_AUTH_URL'),
    basePath: BASE_PATH,
    disabledPaths: DISABLED_AUTH_PATHS,
    secret: env.get('BETTER_AUTH_SECRET'),
    trustedOrigins: [env.get('WEB_ORIGIN')],
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
    },
    user: {
      // App fields on the user table; never set through the auth routes.
      additionalFields: {
        avatarKey: { type: 'string', required: false, input: false },
        theme: { type: 'string', required: false, input: false, defaultValue: 'dark' },
        locale: { type: 'string', required: false, input: false },
        maxServersOverride: { type: 'number', required: false, input: false },
      },
    },
    advanced: {
      cookiePrefix: 'gameplay',
      // nginx / cloudflared put the client IP here (sessions keep it for the admin panel).
      ipAddress: { ipAddressHeaders: ['x-forwarded-for'] },
    },
    rateLimit: {
      enabled: env.get('NODE_ENV') !== 'test',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 10 },
        '/sign-in/username': { window: 60, max: 10 },
        '/sign-up/email': { window: 60, max: 5 },
        '/two-factor/verify-totp': { window: 60, max: 10 },
        '/two-factor/verify-backup-code': { window: 60, max: 10 },
      },
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 32,
        usernameValidator: (value) => USERNAME_PATTERN.test(value),
      }),
      // role "admin" is the platform admin; everyone else is "user".
      admin(),
      twoFactor({ issuer: 'Gameplay' }),
      disabledAuthPrefixes(BASE_PATH),
      // OpenAPI of the auth routes, shown in /api/docs next to the app's.
      ...(isDocsEnabled(env) ? [openAPI({ disableDefaultReference: true })] : []),
    ],
    // Required by @thallesp/nestjs-better-auth to register @BeforeHook/@AfterHook.
    hooks: {},
  })
}

export type Auth = ReturnType<typeof createAuth>
export type AuthSession = Auth['$Infer']['Session']
export type AuthUser = AuthSession['user']
