const credentialsByEmail = { identifier: 'admin@gameplay.local', password: 'admin-pass-123' }
const credentialsByUsername = { identifier: 'admin', password: 'admin-pass-123' }

const signUpValues = {
  username: 'newplayer',
  email: 'new@gameplay.local',
  password: 'player-pass-123',
  confirmPassword: 'player-pass-123',
  inviteKey: 'ABC234',
}

const signedInResult = { data: { user: { id: 'u1' } }, error: null }
const twoFactorResult = { data: { twoFactorRedirect: true, twoFactorMethods: ['totp'] }, error: null }
const okResult = { data: { status: true }, error: null }

const failure = (code: string, status: number) => ({ data: null, error: { code, message: code, status } })

export { credentialsByEmail, credentialsByUsername, failure, okResult, signedInResult, signUpValues, twoFactorResult }
