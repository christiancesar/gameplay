import { Controller, Delete, HttpCode, HttpStatus, Param, Put, UploadedFile } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { ServerImageResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { requireImageFile, UploadImage } from '../../storage/upload/upload-image.decorator'
import { ServerImageResponseDto } from '../dtos/server.dto'
import type { ServerImageKind } from '../domain/server-images'
import { RemoveServerImageUseCase } from '../use-cases/remove-server-image.use-case'
import { UploadServerImageUseCase } from '../use-cases/upload-server-image.use-case'

// Icon (square 256) and cover (16:9 1280x720), same flow for both.
@ApiTags('servers')
@Controller('servers/:serverId')
export class ServerImagesController {
  constructor(
    private readonly uploadImage: UploadServerImageUseCase,
    private readonly removeImage: RemoveServerImageUseCase,
  ) {}

  @Put('icon')
  @UploadImage()
  @ZodResponse({ status: HttpStatus.OK, type: ServerImageResponseDto })
  uploadIcon(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ServerImageResponse> {
    return this.upload(user, serverId, 'icon', file)
  }

  @Delete('icon')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async removeIcon(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<void> {
    await this.removeImage.execute({ serverId, userId: user.id, kind: 'icon' })
  }

  @Put('cover')
  @UploadImage()
  @ZodResponse({ status: HttpStatus.OK, type: ServerImageResponseDto })
  uploadCover(
    @CurrentUser() user: AuthUser,
    @Param('serverId') serverId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ServerImageResponse> {
    return this.upload(user, serverId, 'cover', file)
  }

  @Delete('cover')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async removeCover(@CurrentUser() user: AuthUser, @Param('serverId') serverId: string): Promise<void> {
    await this.removeImage.execute({ serverId, userId: user.id, kind: 'cover' })
  }

  private upload(user: AuthUser, serverId: string, kind: ServerImageKind, file: Express.Multer.File | undefined) {
    return this.uploadImage.execute({ serverId, userId: user.id, kind, file: requireImageFile(file) })
  }
}
