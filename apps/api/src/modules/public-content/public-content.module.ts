import { Module } from '@nestjs/common'
import { AdminPublicContentController } from './controllers/admin-public-content.controller'
import { PublicContentController } from './controllers/public-content.controller'
import { PublicContentService } from './public-content.service'

@Module({
  controllers: [PublicContentController, AdminPublicContentController],
  providers: [PublicContentService],
  exports: [PublicContentService],
})
export class PublicContentModule {}
