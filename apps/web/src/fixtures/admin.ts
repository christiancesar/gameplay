// Dados fictícios do painel admin, usados só nas stories.
import type { AdminDeviceItem, HardwareSummary } from '@/modules/admin/views/hardware-tab.view'
import type { AdminServerItem } from '@/modules/admin/views/servers-tab.view'
import type { AdminServerMember } from '@/modules/admin/views/server-members-dialog.view'
import type { AdminSessionItem } from '@/modules/admin/views/sessions-dialog.view'
import type { AdminUserItem } from '@/modules/admin/views/users-tab.view'
import type { RegistrationKeyItem } from '@/modules/admin/views/keys-tab.view'

import { gamingPc, macbook, oldNotebook } from './hardware'
import { people, servers } from './index'
import { members } from './server-settings'

const hour = 3_600_000
const at = (offset: number) => new Date(Date.now() + offset).toISOString()
const userBase = { isSuspended: false, isPlatformAdmin: false, sessionCount: 1, serverLimit: { value: 1, isOverride: false }, serversOwned: 0 }

export const adminUsers: AdminUserItem[] = [
  { ...people.shinigame, ...userBase, isOnline: true, isPlatformAdmin: true, sessionCount: 2, serversOwned: 1 },
  { ...people.kisnaider, ...userBase, isOnline: true, serversOwned: 1, serverLimit: { value: 3, isOverride: true } },
  { ...people.jacutinga, ...userBase, isOnline: false },
  { ...people.marreta, ...userBase, isOnline: false, isSuspended: true, sessionCount: 0 },
  { ...people.lua, ...userBase, isOnline: true, sessionCount: 3 },
]

export const adminSessions: AdminSessionItem[] = [
  { id: 'se1', ip: '187.64.12.201', device: 'Chrome 141 · Windows', lastActiveAt: at(0), isActiveNow: true },
  { id: 'se2', ip: '177.32.90.15', device: 'Edge 140 · Windows', lastActiveAt: at(-3 * hour), isActiveNow: false },
  { id: 'se3', ip: '2804:14c:5b:8a::1', device: 'Chrome 141 · Android', lastActiveAt: at(-50 * hour), isActiveNow: false },
]

export const adminServers: AdminServerItem[] = [
  {
    ...servers.turbex,
    ownerName: people.shinigame.name,
    members: { count: 6, limit: 10, isOverride: false },
    rooms: { count: 2, limit: 2, isOverride: false },
  },
  {
    ...servers.clanZero,
    ownerName: people.kisnaider.name,
    members: { count: 15, limit: 20, isOverride: true },
    rooms: { count: 1, limit: 2, isOverride: false },
  },
]

export const registrationKeys: RegistrationKeyItem[] = [
  { id: 'k1', hint: 'X4P', createdAt: at(-2 * hour), expiresAt: at(5 * 24 * hour), status: { type: 'active' } },
  { id: 'k2', hint: 'M9Q', createdAt: at(-30 * hour), expiresAt: at(6 * 24 * hour), status: { type: 'used', userName: people.lua.name } },
  { id: 'k3', hint: 'B7T', createdAt: at(-80 * hour), expiresAt: at(-8 * hour), status: { type: 'expired' } },
  { id: 'k4', hint: 'R2W', createdAt: at(-10 * hour), expiresAt: at(20 * 24 * hour), status: { type: 'revoked' } },
]

export const recoveryCodes = ['8F3K-29QM', 'TX7P-4LNA', 'Q2WE-9RT5', 'ZB6Y-HU81', 'M4KD-7CXP', 'N8VS-3JQ2', 'J5GR-6FLW', 'C1HT-2YZB']

/** QR fictício (não é um código válido), só para a story. */
export const fakeQrCode = (() => {
  const size = 25
  let seed = 7
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const finder = (x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`
  let cells = ''
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const inFinder = (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9)
      if (!inFinder && rand() > 0.5) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`
    }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${cells}${finder(0, 0)}${finder(size - 7, 0)}${finder(0, size - 7)}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
})()

export const adminServerMembers: AdminServerMember[] = members

export const adminDevices: AdminDeviceItem[] = [
  { id: 'd1', user: people.shinigame, label: 'Windows 11 · Chrome 141', lastSeenAt: at(-5 * 60_000), hardware: gamingPc },
  { id: 'd2', user: people.shinigame, label: 'macOS 15.4 · Chrome 141', lastSeenAt: at(-3 * 24 * hour), hardware: macbook },
  { id: 'd3', user: people.jacutinga, label: 'Windows 10 · Edge 140', lastSeenAt: at(-2 * hour), hardware: oldNotebook },
  { id: 'd4', user: people.kisnaider, label: 'Windows 11 · Chrome 141', lastSeenAt: at(-20 * 60_000), hardware: { ...gamingPc, cpu: { logicalCores: 12 }, gpu: { ...gamingPc.gpu, renderer: 'AMD Radeon RX 6700 XT (D3D11)' } } },
]

export const hardwareSummary: HardwareSummary = { devices: 4, minCores: 4, minMemoryGb: 4, accelerationPercent: 75, h264HardwarePercent: 75 }
