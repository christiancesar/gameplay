import type { ProfileRecord } from '../domain/account'

// The accounts unit tests start with user "u1": dark theme, Portuguese.
export const SEED_PROFILE: Partial<ProfileRecord> & { id: string } = { id: 'u1', theme: 'dark', locale: 'pt' }

// Two browsers of the same person (ids the web generates and keeps).
export const DEVICE_A = '6f1c2a52-8a3b-4d0e-9a39-0d8e6c1f2b10'
export const DEVICE_B = '0b7e3d2f-1c4a-4e5b-8f6d-2a9c7e1b3d40'
