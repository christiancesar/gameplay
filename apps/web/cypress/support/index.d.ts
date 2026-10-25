import type { AdminCredentials, Credentials } from './credentials'
import type { RtcStats } from './rtc-probe'

declare global {
  namespace Cypress {
    interface Chainable {
      /** Signs in through the auth API and caches the session with `cy.session`. */
      login(credentials: Credentials): Chainable<void>
      /** Same for an admin with 2FA on: password step, then a TOTP code. */
      loginAdmin(credentials: AdminCredentials): Chainable<void>
      /** `<run id>-<tag>-<random>`, a name the cleanup finds and no other run uses. */
      uniqueName(tag: string): Chainable<string>
      /** Waits until every peer connection of the app is connected and the asked media (audio by default) flows in. */
      waitForMedia(wait?: { audio?: boolean; video?: boolean }): Chainable<RtcStats>
    }
  }
}

export {}
