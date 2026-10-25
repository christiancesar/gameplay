import { create } from 'zustand'

type PendingTwoFactorState = {
  /**
   * True after a sign-in answered `twoFactorRedirect`. The Better Auth 2FA cookie is
   * httpOnly, so this in-memory flag is the only way to know a login is pending.
   * Lost on reload on purpose: the cookie is short-lived anyway.
   */
  pending: boolean
  markPending: () => void
  clear: () => void
}

const usePendingTwoFactorStore = create<PendingTwoFactorState>()((set) => ({
  pending: false,
  markPending: () => set({ pending: true }),
  clear: () => set({ pending: false }),
}))

export { usePendingTwoFactorStore }
