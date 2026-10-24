import { Injectable } from '@nestjs/common'
import { registrationKeySchema, usernameSchema } from '@gameplay/shared'
import { type AuthHookContext, BeforeHook, Hook } from '@thallesp/nestjs-better-auth'
import { APIError } from 'better-auth/api'
import { z } from 'zod'

const signUpExtrasSchema = z.object({
  username: usernameSchema,
  registrationKey: registrationKeySchema,
})

// Runs before Better Auth creates the account. Sign-up requires a username and
// a registration key; the key is checked against the database in BE-05.
@Hook()
@Injectable()
export class SignUpHook {
  @BeforeHook('/sign-up/email')
  handle(ctx: AuthHookContext) {
    const extras = signUpExtrasSchema.safeParse(ctx.body)
    if (!extras.success) {
      throw new APIError('BAD_REQUEST', {
        code: 'VALIDATION_FAILED',
        message: z.prettifyError(extras.error),
      })
    }

    // Better Auth requires a display name; the app only has the username.
    ctx.body.name ??= extras.data.username
  }
}
