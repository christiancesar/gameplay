import { z } from 'zod'

export const REGISTRATION_KEY_LENGTH = 6

// Letters and digits without the ambiguous ones (0/O, 1/I).
export const REGISTRATION_KEY_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

// Case does not matter; the key is compared in upper case.
export const registrationKeySchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(REGISTRATION_KEY_LENGTH)
  .regex(new RegExp(`^[${REGISTRATION_KEY_ALPHABET}]+$`))
