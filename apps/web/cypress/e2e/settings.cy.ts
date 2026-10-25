import type { Credentials } from '../support/credentials'

type UserRow = { username: string; displayUsername: string; theme: string; locale: string | null }

// User settings modal: appearance (theme, language) and profile (username).
describe('Settings', () => {
  let user: Credentials

  // One user per test: theme and language are saved in the account and would leak into the next test.
  beforeEach(() => {
    cy.task<Credentials>('db:createUser', { tag: 'settings' }).then((created) => {
      user = created
    })
    cy.then(() => cy.login(user))
    cy.visit('/')
    cy.findByRole('button', { name: 'Settings' }).click()
    cy.findByRole('dialog').should('be.visible')
  })

  function openSection(name: string) {
    cy.findByRole('dialog').within(() => cy.findByRole('button', { name }).click())
  }

  it('switches the theme and keeps it after a reload', () => {
    openSection('Appearance')
    cy.findByRole('radio', { name: 'Light' }).click()
    cy.get('html').should('have.class', 'light')
    cy.task<UserRow>('db:getUser', user.username).its('theme').should('eq', 'light')

    // The modal state lives in the URL, so it is still open after the reload.
    cy.reload()
    cy.get('html').should('have.class', 'light')
    cy.findByRole('radio', { name: 'Dark' }).click()
    cy.get('html').should('have.class', 'dark')
  })

  it('switches the language to Portuguese', () => {
    openSection('Appearance')
    cy.findByRole('dialog').within(() => cy.findByRole('radio', { name: 'PT' }).click())
    cy.findByRole('navigation', { name: 'Configurações' }).within(() => {
      cy.findByRole('button', { name: 'Aparência' }).should('be.visible')
    })
    cy.task<UserRow>('db:getUser', user.username).its('locale').should('eq', 'pt')
  })

  it('changes the username', () => {
    cy.uniqueName('renamed').then((next) => {
      openSection('Profile')
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText('Username').clear()
        cy.findByLabelText('Username').type(next)
        cy.findByRole('button', { name: 'Save' }).click()
      })
      cy.task<UserRow | null>('db:getUser', user.username).should('be.null')
      cy.task<UserRow | null>('db:getUser', next.toLowerCase()).its('displayUsername').should('eq', next)
      cy.findByRole('dialog').within(() => cy.findByRole('button', { name: 'Close' }).click())
      cy.findByText(next).should('be.visible')
    })
  })
})
