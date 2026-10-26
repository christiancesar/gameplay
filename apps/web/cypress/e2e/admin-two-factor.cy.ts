import type { AdminCredentials, Credentials } from '../support/credentials'

// F12.1 and the 2FA step of the sign-in: authenticator app and recovery code.
describe('Admin two-factor authentication', () => {
  describe('setup', () => {
    let admin: Credentials

    before(() => {
      cy.task<Credentials>('db:createUser', { tag: 'admin-setup', role: 'admin' }).then((created) => {
        admin = created
      })
    })

    it('sends an admin without 2FA to the setup, enables it and shows the recovery codes', () => {
      cy.login(admin)
      cy.visit('/admin')
      cy.location('pathname').should('eq', '/admin/setup')

      cy.findByLabelText('Password').type(admin.password)
      cy.findByRole('button', { name: 'Continue' }).click()

      cy.findByRole('code')
        .invoke('text')
        .then((secret) => cy.task<string>('auth:totp', secret.trim()))
        .then((code) => {
          cy.findByLabelText(/6-digit code/).type(code)
        })
      cy.findByRole('button', { name: 'Verify' }).click()

      cy.findByText('Save your recovery codes').should('be.visible')
      cy.findAllByRole('listitem').should('have.length.at.least', 5)
      cy.findByRole('button', { name: 'I saved my codes' }).click()
      cy.location('pathname').should('eq', '/admin/users')
      cy.task<{ twoFactorEnabled: boolean }>('db:getUser', admin.username).its('twoFactorEnabled').should('eq', true)
    })

    it('refuses a wrong code during the setup', () => {
      cy.task<Credentials>('db:createUser', { tag: 'admin-wrong', role: 'admin' }).then((other) => {
        cy.login(other)
        cy.visit('/admin/setup')
        cy.findByLabelText('Password').type(other.password)
        cy.findByRole('button', { name: 'Continue' }).click()
        cy.findByLabelText(/6-digit code/).type('000000')
        cy.findByRole('button', { name: 'Verify' }).click()
        cy.findByText('Invalid code. Try again.').should('be.visible')
      })
    })
  })

  describe('sign-in', () => {
    let admin: AdminCredentials

    before(() => {
      cy.task<AdminCredentials>('db:createAdminWithTwoFactor', 'admin-login').then((created) => {
        admin = created
      })
    })

    beforeEach(() => {
      cy.visit('/sign-in')
      cy.findByLabelText('Email or username').type(admin.username)
      cy.findByLabelText('Password').type(admin.password)
      cy.findByRole('button', { name: 'Login' }).click()
      cy.findByText('Two-factor authentication').should('be.visible')
    })

    it('asks for the authenticator code and signs in with it', () => {
      cy.task<string>('auth:freshTotp', admin.secret).then((code) => {
        cy.findByLabelText('Authentication code').type(code)
      })
      cy.findByRole('button', { name: 'Verify' }).click()
      cy.location('pathname').should('eq', '/')
      cy.findByText('Your servers').should('be.visible')
    })

    it('rejects a wrong authenticator code', () => {
      cy.findByLabelText('Authentication code').type('000000')
      cy.findByRole('button', { name: 'Verify' }).click()
      cy.findByText('Invalid code. Try again.').should('be.visible')
      cy.location('pathname').should('eq', '/sign-in')
    })

    it('signs in with a recovery code', () => {
      cy.findByRole('button', { name: 'Use a recovery code' }).click()
      cy.findByLabelText('Recovery code').type(admin.recoveryCodes[0])
      cy.findByRole('button', { name: 'Verify' }).click()
      cy.location('pathname').should('eq', '/')
      cy.findByText('Your servers').should('be.visible')
    })
  })
})
