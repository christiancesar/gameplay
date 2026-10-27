import { Module } from '@nestjs/common'
import { EnvService } from '../../env/env.service'
import { LimitsModule } from '../limits/limits.module'
import { IceController } from './controllers/ice.controller'
import { TurnRevocationListener } from './listeners/turn-revocation.listener'
import { IceProvider } from './providers/ice/ice.provider'
import { CloudflareIceProvider } from './providers/ice/cloudflare/cloudflare.ice.provider'
import { CoturnIceProvider } from './providers/ice/coturn/coturn.ice.provider'
import { StunOnlyIceProvider } from './providers/ice/stun-only/stun-only.ice.provider'
import { IceHealthService } from './services/ice-health.service'
import { GetIceConfigUseCase } from './use-cases/get-ice-config.use-case'

// The env schema requires each provider's variables when it is picked.
export function createIceProvider(env: EnvService, stunOnly: StunOnlyIceProvider): IceProvider {
  const ttlSeconds = env.get('ICE_TTL_SECONDS')
  switch (env.get('ICE_PROVIDER')) {
    case 'cloudflare':
      return new CloudflareIceProvider({
        keyId: env.get('CLOUDFLARE_TURN_KEY_ID') as string,
        apiToken: env.get('CLOUDFLARE_TURN_API_TOKEN') as string,
        ttlSeconds,
      })
    case 'coturn':
      return new CoturnIceProvider({
        stunUrls: env.get('STUN_URLS'),
        turnUrls: env.get('COTURN_URLS') as string[],
        secret: env.get('COTURN_SECRET') as string,
        ttlSeconds,
      })
    case 'stun-only':
      return stunOnly
  }
}

// ICE servers for WebRTC and the client IP seen over HTTP.
@Module({
  imports: [LimitsModule],
  controllers: [IceController],
  providers: [
    {
      provide: StunOnlyIceProvider,
      inject: [EnvService],
      useFactory: (env: EnvService) => new StunOnlyIceProvider(env.get('STUN_URLS')),
    },
    { provide: IceProvider, inject: [EnvService, StunOnlyIceProvider], useFactory: createIceProvider },
    GetIceConfigUseCase,
    TurnRevocationListener,
    IceHealthService,
  ],
  exports: [IceHealthService],
})
export class IceModule {}
