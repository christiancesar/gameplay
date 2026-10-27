import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateApiEnv } from '@gameplay/env'
import { EnvService } from './env.service'

@Global()
@Module({
  imports: [ConfigModule.forRoot({ validate: validateApiEnv })],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
