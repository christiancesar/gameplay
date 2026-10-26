import type { AdminCredentials, Credentials } from './credentials'
import { collectRtcStats } from './rtc-probe'
import type { ProbedWindow, RtcStats } from './rtc-probe'

/** Rate limits are per IP; a fake one per login keeps the specs under them. */
function fakeIp() {
  return `10.${Cypress._.random(0, 255)}.${Cypress._.random(0, 255)}.${Cypress._.random(1, 254)}`
}

function authRequest(path: string, body: object) {
  return cy.request({
    method: 'POST',
    url: `/api/auth${path}`,
    body,
    headers: { origin: Cypress.config('baseUrl') ?? '', 'x-forwarded-for': fakeIp() },
  })
}

function validateSession() {
  cy.request({ url: '/api/auth/get-session', headers: { 'x-forwarded-for': fakeIp() } })
    .its('body.user')
    .should('exist')
}

Cypress.Commands.add('login', ({ email, password }: Credentials) => {
  cy.session(
    ['user', email],
    () => {
      authRequest('/sign-in/email', { email, password }).its('status').should('eq', 200)
    },
    { validate: validateSession },
  )
})

Cypress.Commands.add('loginAdmin', ({ email, password, secret }: AdminCredentials) => {
  cy.session(
    ['admin', email],
    () => {
      authRequest('/sign-in/email', { email, password }).its('body.twoFactorRedirect').should('eq', true)
      cy.task<string>('auth:totp', secret).then((code) => {
        authRequest('/two-factor/verify-totp', { code }).its('status').should('eq', 200)
      })
    },
    { validate: validateSession },
  )
})

Cypress.Commands.add('uniqueName', (tag: string) =>
  cy.task<string>('run:id').then((runId) => `${runId}-${tag}-${Cypress._.random(1000, 9999)}`),
)

type MediaWait = { audio?: boolean; video?: boolean }

/** Polls the app's peer connections until all are connected and the asked media flows (about 20 s at most). */
Cypress.Commands.add('waitForMedia', ({ audio = true, video = false }: MediaWait = {}) => {
  const attempt = (left: number): Cypress.Chainable<RtcStats> =>
    cy
      .window({ log: false })
      .then((win) => cy.wrap<Promise<RtcStats>, RtcStats>(collectRtcStats(win as ProbedWindow), { log: false }))
      .then((stats: RtcStats) => {
        const connected =
          stats.connectionStates.length > 0 && stats.connectionStates.every((state) => state === 'connected')
        const flowing = (!audio || stats.audioInboundBytes > 0) && (!video || stats.videoFramesDecoded > 0)
        if (connected && flowing) return cy.wrap(stats, { log: false })
        if (left <= 0) throw new Error(`Media is not flowing: ${JSON.stringify(stats)}`)
        return cy.wait(500, { log: false }).then(() => attempt(left - 1))
      })
  return attempt(40)
})

export { fakeIp }
