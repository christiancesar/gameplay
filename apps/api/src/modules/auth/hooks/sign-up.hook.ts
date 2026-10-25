import { Injectable } from '@nestjs/common'
import { registrationKeySchema, usernameSchema } from '@gameplay/shared'
import { AfterHook, type AuthHookContext, BeforeHook, Hook } from '@thallesp/nestjs-better-auth'
import { APIError } from 'better-auth/api'
import { z } from 'zod'
import { DomainError } from '../../../common/errors/domain-error'
import { ConsumeRegistrationInviteUseCase } from '../../registration-invites/use-cases/consume-registration-invite.use-case'
import { SettleRegistrationInviteUseCase } from '../../registration-invites/use-cases/settle-registration-invite.use-case'

const signUpExtrasSchema = z.object({
  username: usernameSchema,
  registrationKey: registrationKeySchema,
})

// Sign-up requires a username and a registration key. The key is taken
// before Better Auth creates the account; after it, the key is linked to the
// account, or given back when the sign-up failed (email taken, for example).
@Hook()
@Injectable()
export class SignUpHook {
  constructor(
    private readonly consumeInvite: ConsumeRegistrationInviteUseCase,
    private readonly settleInvite: SettleRegistrationInviteUseCase,
  ) {}

  @BeforeHook('/sign-up/email')
  async before(ctx: AuthHookContext) {
    const extras = signUpExtrasSchema.safeParse(ctx.body)
    if (!extras.success) {
      throw new APIError('BAD_REQUEST', {
        code: 'VALIDATION_FAILED',
        message: z.prettifyError(extras.error),
      })
    }

    // Better Auth requires a display name; the app only has the username.
    ctx.body.name ??= extras.data.username

    try {
      await this.consumeInvite.execute(extras.data.registrationKey)
    } catch (error) {
      if (error instanceof DomainError) throw new APIError('BAD_REQUEST', { code: error.code, message: error.message })
      throw error
    }
  }

  // Runs only when the before hook passed, so the key was taken here.
  @AfterHook('/sign-up/email')
  async after(ctx: AuthHookContext) {
    await this.settleInvite.execute({
      key: String(ctx.body.registrationKey),
      userId: ctx.context.newSession?.user.id ?? null,
    })
  }
}
