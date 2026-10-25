import type { AdminCredentials, Credentials } from './credentials'

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

export { fakeIp }
