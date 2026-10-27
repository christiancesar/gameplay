import type { MediaSettings, ServerMediaOverrides } from '@gameplay/contracts'
import { MediaSettingsRepository, type ServerMediaException } from '../media-settings.repository'

const FOLLOW_GLOBAL: ServerMediaOverrides = { sfu: null, mesh: null, turn: null }

export class InMemoryMediaSettingsRepository extends MediaSettingsRepository {
  global: MediaSettings = { sfu: true, mesh: true, turn: true }
  sfuBudgetGb = 800
  // serverId -> name and overrides; a server exists when it's in the map.
  readonly servers = new Map<string, { name: string; overrides: ServerMediaOverrides }>()

  addServer(serverId: string, name = serverId) {
    this.servers.set(serverId, { name, overrides: { ...FOLLOW_GLOBAL } })
  }

  async getGlobal(): Promise<MediaSettings> {
    return { ...this.global }
  }

  async setGlobal(settings: MediaSettings): Promise<void> {
    this.global = { ...settings }
  }

  async findServer(serverId: string): Promise<ServerMediaOverrides | null> {
    const server = this.servers.get(serverId)
    return server ? { ...server.overrides } : null
  }

  async setServer(serverId: string, overrides: ServerMediaOverrides): Promise<boolean> {
    const server = this.servers.get(serverId)
    if (!server) return false
    server.overrides = { ...overrides }
    return true
  }

  async listExceptions(): Promise<ServerMediaException[]> {
    return [...this.servers.entries()]
      .filter(([, { overrides }]) => Object.values(overrides).some((value) => value !== null))
      .map(([serverId, { name, overrides }]) => ({ serverId, serverName: name, overrides: { ...overrides } }))
      .sort((a, b) => a.serverName.localeCompare(b.serverName))
  }

  async getSfuBudgetGb(): Promise<number> {
    return this.sfuBudgetGb
  }

  async setSfuBudgetGb(budgetGb: number): Promise<void> {
    this.sfuBudgetGb = budgetGb
  }
}
