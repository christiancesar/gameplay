import { Injectable } from '@nestjs/common'
import { type AuthHookContext, BeforeHook, Hook } from '@thallesp/nestjs-better-auth'
import { APIError } from 'better-auth/api'

// The user changes their name and username through /update-user. The avatar
// (`image`) only comes from the upload route (BE-08), which validates and
// processes the file; an external URL would skip that.
@Hook()
@Injectable()
export class UpdateUserHook {
  @BeforeHook('/update-user')
  handle(ctx: AuthHookContext) {
    if (ctx.body && 'image' in ctx.body) {
      throw new APIError('BAD_REQUEST', {
        code: 'IMAGE_UPLOAD_ONLY',
        message: 'Change the avatar through the avatar upload.',
      })
    }
  }
}
