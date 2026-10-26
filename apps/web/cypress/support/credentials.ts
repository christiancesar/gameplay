type Credentials = { id: string; username: string; email: string; password: string }
type AdminCredentials = Credentials & { secret: string; recoveryCodes: string[] }

export type { AdminCredentials, Credentials }
