import { avatarResponseSchema, type UpdatePreferencesRequest } from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

/** Theme and language saved on the account. Only the fields sent change. */
async function updatePreferences(request: UpdatePreferencesRequest): Promise<void> {
  await http.patch('/me/preferences', request)
}

/** The API crops and converts the file (form field `file`) and returns the public URL. */
async function uploadAvatar(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const { data } = await http.put('/me/avatar', body)
  return avatarResponseSchema.parse(data).image
}

async function removeAvatar(): Promise<void> {
  await http.delete('/me/avatar')
}

export { removeAvatar, updatePreferences, uploadAvatar }
