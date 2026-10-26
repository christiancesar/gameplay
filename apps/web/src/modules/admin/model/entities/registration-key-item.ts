import type { RegistrationInviteValidity } from '@gameplay/contracts'

export type RegistrationKeyItem = {
  id: string
  /** Só os últimos caracteres são conhecidos depois de gerada (a key fica em hash). */
  hint: string
  createdAt: string
  expiresAt: string
  status: { type: 'active' } | { type: 'used'; userName: string } | { type: 'revoked' } | { type: 'expired' }
}

export type KeyDuration = RegistrationInviteValidity
