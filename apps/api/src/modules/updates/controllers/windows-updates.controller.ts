import { Controller, Get, NotFoundException, Param, Redirect } from '@nestjs/common'
import { ApiFoundResponse, ApiTags } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { SkipThrottle } from '@nestjs/throttler'
import { EnvService } from '../../../env/env.service'

type FeedRedirect = { statusCode: 302; url: string }

@ApiTags('updates')
@AllowAnonymous()
@SkipThrottle()
@Controller('updates/windows')
export class WindowsUpdatesController {
  constructor(private readonly env: EnvService) {}

  /** The Squirrel RELEASES file stays in object storage; this URL remains stable for the desktop app. */
  @Get(':channel/RELEASES')
  @Redirect()
  @ApiFoundResponse({ description: 'Redirects to the immutable Squirrel feed in object storage.' })
  releases(@Param('channel') channel: string): FeedRedirect {
    const baseUrl = this.env.get('WINDOWS_UPDATE_FEED_BASE_URL')
    if (!baseUrl || channel !== 'stable') throw new NotFoundException()

    return {
      statusCode: 302,
      url: new URL(`${channel}/RELEASES`, `${baseUrl.replace(/\/$/, '')}/`).toString(),
    }
  }
}
