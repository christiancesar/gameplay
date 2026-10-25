import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Put, UploadedFile } from '@nestjs/common'
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger'
import type { AvatarResponse, Profile } from '@gameplay/shared'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import { requireImageFile, UploadImage } from '../../storage/upload/upload-image.decorator'
import { AvatarResponseDto, ProfileDto, toProfileDto, UpdatePreferencesRequestDto } from '../dtos/account.dto'
import { GetMyProfileUseCase } from '../use-cases/get-my-profile.use-case'
import { RemoveAvatarUseCase } from '../use-cases/remove-avatar.use-case'
import { UpdateMyPreferencesUseCase } from '../use-cases/update-my-preferences.use-case'
import { UploadAvatarUseCase } from '../use-cases/upload-avatar.use-case'

@ApiTags('account')
@Controller('me')
export class MyProfileController {
  constructor(
    private readonly getProfile: GetMyProfileUseCase,
    private readonly updatePreferences: UpdateMyPreferencesUseCase,
    private readonly uploadAvatar: UploadAvatarUseCase,
    private readonly removeAvatar: RemoveAvatarUseCase,
  ) {}

  @Get('profile')
  @ZodResponse({ status: HttpStatus.OK, type: ProfileDto })
  async get(@CurrentUser() user: AuthUser): Promise<Profile> {
    return toProfileDto(await this.getProfile.execute(user.id))
  }

  @Patch('preferences')
  @ZodResponse({ status: HttpStatus.OK, type: ProfileDto })
  async update(@CurrentUser() user: AuthUser, @Body() body: UpdatePreferencesRequestDto): Promise<Profile> {
    return toProfileDto(await this.updatePreferences.execute({ userId: user.id, preferences: body }))
  }

  @Put('avatar')
  @UploadImage()
  @ZodResponse({ status: HttpStatus.OK, type: AvatarResponseDto })
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<AvatarResponse> {
    return this.uploadAvatar.execute({ userId: user.id, file: requireImageFile(file) })
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthUser): Promise<void> {
    await this.removeAvatar.execute(user.id)
  }
}
