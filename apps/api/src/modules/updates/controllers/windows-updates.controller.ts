import { BadGatewayException, Controller, Get, NotFoundException, Param, Res } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { SkipThrottle } from '@nestjs/throttler'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import type { Response } from 'express'
import { EnvService } from '../../../env/env.service'

@ApiTags('updates')
@AllowAnonymous()
@SkipThrottle()
@Controller('updates/windows')
export class WindowsUpdatesController {
  constructor(private readonly env: EnvService) {}

  /** Proxies the Squirrel feed and packages so the desktop only knows the Gameplay origin. */
  @Get(':channel/:artifact')
  @ApiOkResponse({ description: 'Returns a Squirrel feed or artifact from object storage.' })
  async artifact(
    @Param('channel') channel: string,
    @Param('artifact') artifact: string,
    @Res() res: Response,
  ): Promise<void> {
    const baseUrl = this.env.get('WINDOWS_UPDATE_FEED_BASE_URL')
    if (!baseUrl || channel !== 'stable' || !/^[A-Za-z0-9._-]+$/.test(artifact)) throw new NotFoundException()

    const upstreamUrl = new URL(`${channel}/${artifact}`, `${baseUrl.replace(/\/$/, '')}/`)
    let upstream: globalThis.Response
    try {
      upstream = await fetch(upstreamUrl)
    } catch {
      throw new BadGatewayException('Windows update storage is unavailable')
    }

    if (!upstream.ok) {
      res.status(upstream.status).end()
      return
    }

    const contentType = upstream.headers.get('content-type')
    const contentLength = upstream.headers.get('content-length')
    const etag = upstream.headers.get('etag')
    const lastModified = upstream.headers.get('last-modified')
    if (contentType) res.setHeader('Content-Type', contentType)
    if (contentLength) res.setHeader('Content-Length', contentLength)
    if (etag) res.setHeader('ETag', etag)
    if (lastModified) res.setHeader('Last-Modified', lastModified)
    res.setHeader(
      'Cache-Control',
      artifact === 'RELEASES' ? 'no-store, max-age=0' : 'public, max-age=31536000, immutable',
    )

    if (!upstream.body) {
      res.end()
      return
    }

    Readable.fromWeb(upstream.body as unknown as NodeReadableStream<any>).pipe(res)
  }
}
