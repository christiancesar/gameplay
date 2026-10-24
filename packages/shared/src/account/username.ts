import { z } from 'zod'

// 3 to 32 characters: letters, numbers, ".", "-" and "_".
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/

export const usernameSchema = z.string().regex(USERNAME_PATTERN)
