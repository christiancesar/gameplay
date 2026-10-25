import '@testing-library/cypress/add-commands'

import { fakeIp } from './commands'

// The app follows the browser language; the specs read English text.
Cypress.on('window:before:load', (win) => {
  win.localStorage.setItem('i18nextLng', 'en')
})

// Better Auth rate limits by IP (100 calls a minute, sign-up 5); every call the app makes gets its own fake one.
beforeEach(() => {
  cy.intercept('/api/**', (request) => {
    request.headers['x-forwarded-for'] = fakeIp()
  })
})
