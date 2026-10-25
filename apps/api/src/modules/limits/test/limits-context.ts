import { InMemoryPlatformSettingsRepository } from '../repositories/in-memory/in-memory-platform-settings.repository'
import { InMemoryServerLimitsRepository } from '../repositories/in-memory/in-memory-server-limits.repository'
import { InMemoryUserLimitsRepository } from '../repositories/in-memory/in-memory-user-limits.repository'
import { EffectiveLimitsService } from '../services/effective-limits.service'
import { SetUserLimitOverrideUseCase } from '../use-cases/set-user-limit-override.use-case'
import { SEED_USER_LIMITS } from './limits-seed'

// Limits wired to in-memory repositories (global defaults), over the seed.
export function makeLimitsContext() {
  const settings = new InMemoryPlatformSettingsRepository()
  const userLimits = new InMemoryUserLimitsRepository()
  const serverLimits = new InMemoryServerLimitsRepository()
  for (const [userId, limits] of SEED_USER_LIMITS) userLimits.users.set(userId, { ...limits })
  return {
    settings,
    userLimits,
    serverLimits,
    limits: new EffectiveLimitsService(settings, userLimits, serverLimits),
    setUserLimitOverride: new SetUserLimitOverrideUseCase(userLimits),
  }
}
