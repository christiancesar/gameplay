import { Body, Controller, Delete, Get, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type {
  ChangelogEntry,
  FeatureRequest,
  ListChangelogResponse,
  ListFeatureRequestsResponse,
  ListRoadmapResponse,
  VoteResponse,
} from '@gameplay/contracts'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { ZodResponse } from 'nestjs-zod'
import { CurrentUser } from '../../../common/auth/current-user.decorator'
import type { AuthUser } from '../../../lib/auth'
import {
  ChangelogEntryDto,
  CreateFeatureRequestDto,
  FeatureRequestDto,
  ListChangelogResponseDto,
  ListFeatureRequestsResponseDto,
  ListRoadmapResponseDto,
  VoteResponseDto,
} from '../dtos/public-content.dto'
import { PublicContentService } from '../public-content.service'

@ApiTags('public content')
@Controller('public')
export class PublicContentController {
  constructor(private readonly content: PublicContentService) {}

  @Get('roadmap')
  @AllowAnonymous()
  @ZodResponse({ status: HttpStatus.OK, type: ListRoadmapResponseDto })
  listRoadmap(@CurrentUser() user?: AuthUser): Promise<ListRoadmapResponse> {
    return this.content.listPublishedRoadmap(user?.id)
  }

  @Get('changelog')
  @AllowAnonymous()
  @ZodResponse({ status: HttpStatus.OK, type: ListChangelogResponseDto })
  listChangelog(): Promise<ListChangelogResponse> {
    return this.content.listPublishedChangelog()
  }

  @Get('changelog/:slug')
  @AllowAnonymous()
  @ZodResponse({ status: HttpStatus.OK, type: ChangelogEntryDto })
  getChangelog(@Param('slug') slug: string): Promise<ChangelogEntry> {
    return this.content.getPublishedChangelog(slug)
  }

  @Post('roadmap/:itemId/vote')
  @ZodResponse({ status: HttpStatus.OK, type: VoteResponseDto })
  vote(@CurrentUser() user: AuthUser, @Param('itemId') itemId: string): Promise<VoteResponse> {
    return this.content.vote(user.id, itemId)
  }

  @Delete('roadmap/:itemId/vote')
  @ZodResponse({ status: HttpStatus.OK, type: VoteResponseDto })
  removeVote(@CurrentUser() user: AuthUser, @Param('itemId') itemId: string): Promise<VoteResponse> {
    return this.content.removeVote(user.id, itemId)
  }

  @Post('feature-requests')
  @ZodResponse({ status: HttpStatus.CREATED, type: FeatureRequestDto })
  createFeatureRequest(@CurrentUser() user: AuthUser, @Body() body: CreateFeatureRequestDto): Promise<FeatureRequest> {
    return this.content.createFeatureRequest(body, user.id)
  }

  @Get('feature-requests/mine')
  @ZodResponse({ status: HttpStatus.OK, type: ListFeatureRequestsResponseDto })
  listMyFeatureRequests(@CurrentUser() user: AuthUser): Promise<ListFeatureRequestsResponse> {
    return this.content.listMyFeatureRequests(user.id)
  }
}
