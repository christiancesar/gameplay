import { Body, Controller, Get, HttpStatus, Param, Patch, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type {
  ChangelogEntry,
  CreateChangelogEntry,
  CreateRoadmapItem,
  ListAdminFeatureRequestsResponse,
  ListChangelogResponse,
  ListRoadmapResponse,
  ModerateFeatureRequest,
  RoadmapItem,
  UpdateChangelogEntry,
  UpdateRoadmapItem,
} from '@gameplay/contracts'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import { PlatformAdmin } from '../../../common/auth/platform-admin.decorator'
import type { AuthUser } from '../../../lib/auth'
import {
  ChangelogEntryDto,
  CreateChangelogEntryDto,
  CreateRoadmapItemDto,
  AdminFeatureRequestDto,
  ListAdminFeatureRequestsResponseDto,
  ListChangelogResponseDto,
  ListRoadmapResponseDto,
  ModerateFeatureRequestDto,
  RoadmapItemDto,
  UpdateChangelogEntryDto,
  UpdateRoadmapItemDto,
} from '../dtos/public-content.dto'
import { PublicContentService } from '../public-content.service'

@ApiTags('admin: public content')
@PlatformAdmin()
@Controller('admin/public')
export class AdminPublicContentController {
  constructor(private readonly content: PublicContentService) {}

  @Get('roadmap')
  @ZodResponse({ status: HttpStatus.OK, type: ListRoadmapResponseDto })
  listRoadmap(): Promise<ListRoadmapResponse> {
    return this.content.listRoadmap()
  }

  @Post('roadmap')
  @ZodResponse({ status: HttpStatus.CREATED, type: RoadmapItemDto })
  createRoadmap(@CurrentUser() user: AuthUser, @Body() body: CreateRoadmapItemDto): Promise<RoadmapItem> {
    return this.content.createRoadmap(body as CreateRoadmapItem, user.id)
  }

  @Patch('roadmap/:id')
  @ZodResponse({ status: HttpStatus.OK, type: RoadmapItemDto })
  updateRoadmap(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateRoadmapItemDto,
  ): Promise<RoadmapItem> {
    return this.content.updateRoadmap(id, body as UpdateRoadmapItem, user.id)
  }

  @Get('changelog')
  @ZodResponse({ status: HttpStatus.OK, type: ListChangelogResponseDto })
  listChangelog(): Promise<ListChangelogResponse> {
    return this.content.listChangelog()
  }

  @Post('changelog')
  @ZodResponse({ status: HttpStatus.CREATED, type: ChangelogEntryDto })
  createChangelog(@CurrentUser() user: AuthUser, @Body() body: CreateChangelogEntryDto): Promise<ChangelogEntry> {
    return this.content.createChangelog(body as CreateChangelogEntry, user.id)
  }

  @Patch('changelog/:id')
  @ZodResponse({ status: HttpStatus.OK, type: ChangelogEntryDto })
  updateChangelog(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateChangelogEntryDto,
  ): Promise<ChangelogEntry> {
    return this.content.updateChangelog(id, body as UpdateChangelogEntry, user.id)
  }

  @Get('feature-requests')
  @ZodResponse({ status: HttpStatus.OK, type: ListAdminFeatureRequestsResponseDto })
  listFeatureRequests(): Promise<ListAdminFeatureRequestsResponse> {
    return this.content.listFeatureRequests()
  }

  @Patch('feature-requests/:id')
  @ZodResponse({ status: HttpStatus.OK, type: AdminFeatureRequestDto })
  moderateFeatureRequest(@Param('id') id: string, @Body() body: ModerateFeatureRequestDto) {
    return this.content.moderateFeatureRequest(id, body as ModerateFeatureRequest)
  }
}
