import type { Credentials } from '../support/credentials'

// F4: create a server from the Hub.
describe('Create server', () => {
  it('creates a server from the Hub and opens its screen', () => {
    cy.task<Credentials>('db:createUser', { tag: 'creator' }).then((user) => {
      cy.login(user)
      cy.visit('/')
      cy.findByRole('button', { name: /^Create your server/ }).click()

      cy.uniqueName('srv').then((name) => {
        cy.findByRole('dialog').within(() => {
          cy.findByText('Create your server').should('be.visible')
          cy.findByLabelText('Server name').type(name)
          cy.findByRole('button', { name: 'Create server' }).click()
        })

        cy.location('pathname').should('match', /^\/servers\/.+/)
        cy.findAllByText(name).should('have.length.at.least', 1)
        cy.findByText('Room 1').should('be.visible')
      })
    })
  })

  it('asks for a name before creating', () => {
    cy.task<Credentials>('db:createUser', { tag: 'creator-empty' }).then((user) => {
      cy.login(user)
      cy.visit('/')
      cy.findByRole('button', { name: /^Create your server/ }).click()
      cy.findByRole('dialog').within(() => {
        cy.findByRole('button', { name: 'Create server' }).click()
        cy.findByText('Give your server a name.').should('be.visible')
      })
      cy.location('pathname').should('eq', '/')
    })
  })

  it('blocks the button when the user reached the server limit', () => {
    cy.task<Credentials>('db:createUser', { tag: 'creator-limit', maxServersOverride: 0 }).then((user) => {
      cy.login(user)
      cy.visit('/')
      cy.findByRole('button', { name: /^Create your server/ }).should('be.disabled')
      cy.findByText('Limit reached').should('be.visible')
    })
  })
})
