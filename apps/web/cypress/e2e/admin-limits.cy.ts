import type { AdminCredentials, Credentials } from '../support/credentials'

// F12: the platform admin adjusts the server limit of a user. The override must survive a reload (BE-17).
describe('Admin limits', () => {
  let admin: AdminCredentials
  let target: Credentials

  before(() => {
    cy.task<AdminCredentials>('db:createAdminWithTwoFactor', 'limits-admin').then((created) => {
      admin = created
    })
    cy.task<Credentials>('db:createUser', { tag: 'limits-target' }).then((created) => {
      target = created
    })
  })

  beforeEach(() => {
    cy.loginAdmin(admin)
  })

  function findTargetRow() {
    cy.visit('/admin/users')
    cy.findByRole('textbox', { name: 'Search' }).type(target.username)
    return cy.findByRole('row', { name: new RegExp(target.username) })
  }

  it('lists the user with the global default limit', () => {
    findTargetRow().should('contain.text', '(default)')
  })

  it('saves a custom server limit and keeps it after a reload', () => {
    findTargetRow()
    cy.findByRole('button', { name: `Actions: ${target.username}` }).click()
    cy.findByRole('menuitem', { name: 'Adjust server limit' }).click()

    cy.findByRole('dialog').within(() => {
      cy.findByText(`Server limit of ${target.username}`).should('be.visible')
      cy.findByRole('checkbox', { name: /Use the global default/ }).click()
      cy.findByRole('spinbutton', { name: 'Server limit' }).clear()
      cy.findByRole('spinbutton', { name: 'Server limit' }).type('4')
      cy.findByRole('button', { name: 'Save' }).click()
    })
    cy.findByText('Limit saved.').should('be.visible')
    cy.task<{ maxServersOverride: number }>('db:getUser', target.username).its('maxServersOverride').should('eq', 4)

    cy.reload()
    cy.findByRole('textbox', { name: 'Search' }).type(target.username)
    cy.findByRole('row', { name: new RegExp(target.username) })
      .should('contain.text', '0/4')
      .and('not.contain.text', '(default)')
  })

  it('shows the override again in the dialog and goes back to the default', () => {
    findTargetRow()
    cy.findByRole('button', { name: `Actions: ${target.username}` }).click()
    cy.findByRole('menuitem', { name: 'Adjust server limit' }).click()
    cy.findByRole('dialog').within(() => {
      cy.findByRole('checkbox', { name: /Use the global default/ }).should('have.attr', 'aria-checked', 'false')
      cy.findByRole('spinbutton', { name: 'Server limit' }).should('have.value', '4')
      cy.findByRole('checkbox', { name: /Use the global default/ }).click()
      cy.findByRole('button', { name: 'Save' }).click()
    })
    cy.findByText('Limit saved.').should('be.visible')
    cy.reload()
    cy.findByRole('textbox', { name: 'Search' }).type(target.username)
    cy.findByRole('row', { name: new RegExp(target.username) }).should('contain.text', '(default)')
  })
})
