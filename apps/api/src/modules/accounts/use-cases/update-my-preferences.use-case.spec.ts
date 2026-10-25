import { InMemoryProfilesRepository } from '../repositories/in-memory/in-memory-profiles.repository'
import { GetMyProfileUseCase } from './get-my-profile.use-case'
import { UpdateMyPreferencesUseCase } from './update-my-preferences.use-case'

describe('UpdateMyPreferencesUseCase', () => {
  function makeSut() {
    const profiles = new InMemoryProfilesRepository()
    profiles.add({ id: 'u1', theme: 'dark', locale: 'pt' })
    return { sut: new UpdateMyPreferencesUseCase(profiles, new GetMyProfileUseCase(profiles)) }
  }

  it('changes only the fields sent', async () => {
    const { sut } = makeSut()

    const profile = await sut.execute({ userId: 'u1', preferences: { theme: 'light' } })

    expect(profile).toMatchObject({ theme: 'light', locale: 'pt' })
  })

  it('goes back to the browser language with null', async () => {
    const { sut } = makeSut()

    const profile = await sut.execute({ userId: 'u1', preferences: { locale: null } })

    expect(profile.locale).toBeNull()
  })
})
