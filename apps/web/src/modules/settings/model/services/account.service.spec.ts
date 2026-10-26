import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/http', async () => ({
  http: (await import('../../view-models/test/fake-settings-http')).fakeSettingsHttp,
}))

import { fakeSettingsHttp as fakeHttp } from '../../view-models/test/fake-settings-http'

import { removeAvatar, updatePreferences, uploadAvatar } from './account.service'

describe('account service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('patches only the preferences it receives', async () => {
    fakeHttp.patch.mockResolvedValue({ data: {} })
    await updatePreferences({ locale: null })
    expect(fakeHttp.patch).toHaveBeenCalledWith('/me/preferences', { locale: null })
  })

  it('uploads the avatar as multipart under `file` and returns the URL', async () => {
    fakeHttp.put.mockResolvedValue({ data: { image: '/avatars/u1/a.webp' } })
    const file = new File(['x'], 'me.png', { type: 'image/png' })
    await expect(uploadAvatar(file)).resolves.toBe('/avatars/u1/a.webp')
    const [url, body] = fakeHttp.put.mock.calls[0] as [string, FormData]
    expect(url).toBe('/me/avatar')
    expect(body.get('file')).toBe(file)
  })

  it('deletes the avatar', async () => {
    fakeHttp.delete.mockResolvedValue({ data: undefined })
    await removeAvatar()
    expect(fakeHttp.delete).toHaveBeenCalledWith('/me/avatar')
  })
})
