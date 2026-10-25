import { Injectable, Logger } from '@nestjs/common'
import { registrationKeySchema, serverInviteCodeSchema, usernameSchema } from '@gameplay/shared'
import { AfterHook, type AuthHookContext, BeforeHook, Hook } from '@thallesp/nestjs-better-auth'
import { APIError } from 'better-auth/api'
import { z } from 'zod'
import { DomainError } from '../../../common/errors/domain-error'
import { DomainEventBus } from '../../../common/events/domain-event-bus'
import { ServerInviteExpiredError } from '../../memberships/errors/memberships.errors'
import { RequestToJoinUseCase } from '../../memberships/use-cases/request-to-join.use-case'
import { ResolveInviteCodeUseCase } from '../../memberships/use-cases/resolve-invite-code.use-case'
import { ConsumeRegistrationInviteUseCase } from '../../registration-invites/use-cases/consume-registration-invite.use-case'
import { SettleRegistrationInviteUseCase } from '../../registration-invites/use-cases/settle-registration-invite.use-case'

const signUpExtrasSchema = z.object({
  username: usernameSchema,
  registrationKey: registrationKeySchema,
})

// Sent when the sign-up started from a server invite link.
const serverInviteSchema = z.object({ serverInviteCode: serverInviteCodeSchema })

// Sign-up requires a username and a registration key. The key is taken
// before Better Auth creates the account; after it, the key is linked to the
// account, or given back when the sign-up failed (email taken, for example).
// With a server invite code, the join request is created for the new account.
@Hook()
@Injectable()
export class SignUpHook {
  private readonly logger = new Logger(SignUpHook.name)

  constructor(
    private readonly consumeInvite: ConsumeRegistrationInviteUseCase,
    private readonly settleInvite: SettleRegistrationInviteUseCase,
    private readonly requestToJoin: RequestToJoinUseCase,
    private readonly resolveInvite: ResolveInviteCodeUseCase,
    private readonly events: DomainEventBus,
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
    const userId = ctx.context.newSession?.user.id ?? null
    await this.settleInvite.execute({ key: String(ctx.body.registrationKey), userId })

    const invite = serverInviteSchema.safeParse(ctx.body)
    if (userId && invite.success) await this.joinServer(userId, invite.data.serverInviteCode)
  }

  // The account exists by now, so a problem with the invite never fails the
  // sign-up. An invite that expired while the person signed up becomes a Hub
  // notice; any other failure (used, revoked, deleted server) is only logged.
  private async joinServer(userId: string, code: string) {
    try {
      await this.requestToJoin.execute({ code, userId })
    } catch (error) {
      if (error instanceof ServerInviteExpiredError) {
        const { server } = await this.resolveInvite.execute({ code, userId })
        if (server) {
          await this.events.publish('server-invite.expired-on-sign-up', {
            userId,
            serverId: server.id,
            serverName: server.name,
          })
        }
        return
      }
      this.logger.warn({ err: error, userId }, 'Could not use the server invite of a new account')
    }
  }
}
