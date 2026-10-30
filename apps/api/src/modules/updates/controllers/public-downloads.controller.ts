import { BadGatewayException, Controller, Get, NotFoundException, Param, Res } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import type { Response } from 'express'
import { z } from 'zod'
import { EnvService } from '../../../env/env.service'

const downloadArtifactSchema = z.object({
  architecture: z.string().min(1),
  format: z.enum(['squirrel-installer', 'deb', 'appimage']),
  url: z.url(),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})

const publicDownloadsManifestSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  publishedAt: z.iso.datetime(),
  downloads: z.object({
    windows: downloadArtifactSchema,
    linuxDeb: downloadArtifactSchema,
    linuxAppImage: downloadArtifactSchema,
  }),
})

const allowedArtifacts = new Set(['Gameplay-Setup.exe', 'gameplay.deb', 'Gameplay.AppImage'])

@ApiTags('downloads')
@SkipThrottle()
@Controller('downloads')
export class PublicDownloadsController {
  constructor(private readonly env: EnvService) {}

  @Get('latest')
  @ApiOkResponse({ description: 'Returns the public catalog for the latest desktop release.' })
  async latest(@Res() res: Response): Promise<void> {
    const upstream = await this.fetchFromStorage('stable/latest.json')
    if (!upstream.ok) {
      res.status(upstream.status).end()
      return
    }

    let manifest: unknown
    try {
      manifest = publicDownloadsManifestSchema.parse(await upstream.json())
    } catch {
      throw new BadGatewayException('The public downloads manifest is invalid')
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.status(200).send(JSON.stringify(manifest))
  }

  @Get('stable/:artifact')
  @ApiOkResponse({ description: 'Returns a public desktop release artifact.' })
  async artifact(@Param('artifact') artifact: string, @Res() res: Response): Promise<void> {
    if (!allowedArtifacts.has(artifact)) throw new NotFoundException()
    const upstream = await this.fetchFromStorage(`stable/${artifact}`)
    if (!upstream.ok) {
      res.status(upstream.status).end()
      return
    }

    const contentType = upstream.headers.get('content-type')
    const contentLength = upstream.headers.get('content-length')
    const etag = upstream.headers.get('etag')
    if (contentType) res.setHeader('Content-Type', contentType)
    if (contentLength) res.setHeader('Content-Length', contentLength)
    if (etag) res.setHeader('ETag', etag)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    if (!upstream.body) {
      res.end()
      return
    }
    Readable.fromWeb(upstream.body as unknown as NodeReadableStream<any>).pipe(res)
  }

  private async fetchFromStorage(path: string): Promise<globalThis.Response> {
    const baseUrl = this.env.get('DOWNLOADS_BASE_URL')
    if (!baseUrl) throw new NotFoundException()

    try {
      return await fetch(new URL(path, `${baseUrl.replace(/\/$/, '')}/`))
    } catch {
      throw new BadGatewayException('Public download storage is unavailable')
    }
  }
}
