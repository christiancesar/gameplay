import { z } from 'zod'

import { passwordSchema } from '@/modules/auth/model/password.schema'

const resetPasswordSchema = z.object({ password: passwordSchema })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export { resetPasswordSchema }
export type { ResetPasswordValues }
