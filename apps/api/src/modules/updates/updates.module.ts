import { Module } from '@nestjs/common'
import { WindowsUpdatesController } from './controllers/windows-updates.controller'
import { PublicDownloadsController } from './controllers/public-downloads.controller'

@Module({
  controllers: [WindowsUpdatesController, PublicDownloadsController],
})
export class UpdatesModule {}
