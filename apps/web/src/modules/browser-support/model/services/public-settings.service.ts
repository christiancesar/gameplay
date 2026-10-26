import { publicSettingsSchema, type PublicSettings } from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

/** Anonymous: the sign-in page needs the minimum browser version before there is a session. */
async function getPublicSettings(): Promise<PublicSettings> {
  const { data } = await http.get('/settings/public')
  return publicSettingsSchema.parse(data)
}

export { getPublicSettings }
