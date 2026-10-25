import { z } from 'zod'

export const THEMES = ['dark', 'light'] as const
export const themeSchema = z.enum(THEMES)
export type Theme = z.infer<typeof themeSchema>

export const LOCALES = ['en', 'pt'] as const
export const localeSchema = z.enum(LOCALES)
export type Locale = z.infer<typeof localeSchema>

// The signed-in user's own account. Username and password change through the
// Better Auth routes (/update-user, /change-password); the avatar only through
// the upload route.
export const profileSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  displayUsername: z.string().nullable(),
  // Public URL of the avatar, the same value as session.user.image.
  image: z.string().nullable(),
  theme: themeSchema,
  // null: the web follows the browser language.
  locale: localeSchema.nullable(),
})
export type Profile = z.infer<typeof profileSchema>

// Only the fields sent are changed.
export const updatePreferencesRequestSchema = z
  .object({
    theme: themeSchema,
    locale: localeSchema.nullable(),
  })
  .partial()
export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesRequestSchema>

export const avatarResponseSchema = z.object({
  image: z.string(),
})
export type AvatarResponse = z.infer<typeof avatarResponseSchema>
