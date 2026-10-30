import { Module } from '@nestjs/common'
import { WindowsUpdatesController } from './controllers/windows-updates.controller'

@Module({
  controllers: [WindowsUpdatesController],
})
export class UpdatesModule {}
