import { makeAccountsContext } from '../test/accounts-context'

describe('UpdateMyPreferencesUseCase', () => {
  it('changes only the fields sent', async () => {
    const { updatePreferences } = makeAccountsContext()

    const profile = await updatePreferences.execute({ userId: 'u1', preferences: { theme: 'light' } })

    expect(profile).toMatchObject({ theme: 'light', locale: 'pt' })
  })

  it('goes back to the browser language with null', async () => {
    const { updatePreferences } = makeAccountsContext()

    const profile = await updatePreferences.execute({ userId: 'u1', preferences: { locale: null } })

    expect(profile.locale).toBeNull()
  })
})
