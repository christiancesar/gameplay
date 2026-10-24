import { Global, Injectable, Module, type OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { EnvService } from '../env/env.service'
import { PrismaClient } from '../generated/prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(env: EnvService) {
    super({ adapter: new PrismaPg({ connectionString: env.get('DATABASE_URL') }) })
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
