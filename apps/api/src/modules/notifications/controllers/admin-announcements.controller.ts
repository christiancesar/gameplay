import { Body, Controller, HttpStatus, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { SendAnnouncementResponse } from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import type { AuthUser } from '../../../lib/auth'
import { SendAnnouncementRequestDto, SendAnnouncementResponseDto } from '../dtos/notification.dto'
import { SendAnnouncementUseCase } from '../use-cases/send-announcement.use-case'

@ApiTags('admin: announcements')
@PlatformAdmin()
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly sendAnnouncement: SendAnnouncementUseCase) {}

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: SendAnnouncementResponseDto })
  send(@CurrentUser() user: AuthUser, @Body() body: SendAnnouncementRequestDto): Promise<SendAnnouncementResponse> {
    const { title, message, audience } = body
    return this.sendAnnouncement.execute({ title, message, audience, sentById: user.id })
  }
}
