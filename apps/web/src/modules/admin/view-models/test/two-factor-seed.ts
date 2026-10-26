const backupCodes = ['lOrPA-VGZqw', 'Ayq8X-jNO4f', 'zb54z-GD8Yj']

const enrollmentResult = {
  data: {
    method: 'totp',
    totpURI:
      'otpauth://totp/Gameplay:admin%40gameplay.local?secret=MFTHG5BUOJYXKYLQ&issuer=Gameplay&digits=6&period=30',
    backupCodes,
  },
  error: null,
}
const okResult = { data: { token: 't', user: { id: 'u1' } }, error: null }

const failure = (code: string, status: number) => ({ data: null, error: { code, message: code, status } })

export { enrollmentResult, failure, okResult }
