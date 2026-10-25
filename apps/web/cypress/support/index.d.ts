import type { AdminCredentials, Credentials } from './credentials'

declare global {
  namespace Cypress {
    interface Chainable {
      /** Signs in through the auth API and caches the session with `cy.session`. */
      login(credentials: Credentials): Chainable<void>
      /** Same for an admin with 2FA on: password step, then a TOTP code. */
      loginAdmin(credentials: AdminCredentials): Chainable<void>
      /** `<run id>-<tag>-<random>`, a name the cleanup finds and no other run uses. */
      uniqueName(tag: string): Chainable<string>
    }
  }
}

export {}
