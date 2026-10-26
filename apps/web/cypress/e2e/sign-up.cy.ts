// F2: sign-up needs a registration key.
describe('Sign up', () => {
  beforeEach(() => {
    cy.visit('/sign-up')
  })

  function fill(username: string, key: string) {
    cy.findByLabelText('Username').type(username)
    cy.findByLabelText('Email').type(`${username}@e2e.test`)
    cy.findByLabelText('Password').type('e2e-pass-123')
    cy.findByLabelText('Confirm password').type('e2e-pass-123')
    cy.findByLabelText('Invite key').type(key)
    cy.findByRole('button', { name: 'Create account' }).click()
  }

  it('creates the account with a valid key and lands on the Hub', () => {
    cy.uniqueName('signup').then((username) => {
      cy.task<string>('db:createRegistrationKey').then((key) => fill(username, key))
      cy.location('pathname').should('eq', '/')
      cy.findByText(username).should('be.visible')
      cy.task<{ username: string }>('db:getUser', username).its('username').should('eq', username)
    })
  })

  it('shows the error under the key boxes for a key that does not exist', () => {
    cy.uniqueName('badkey').then((username) => fill(username, '222222'))
    cy.findByText(/This invite key is not valid/).should('be.visible')
    cy.location('pathname').should('eq', '/sign-up')
  })

  it('does not reuse a key', () => {
    cy.task<string>('db:createRegistrationKey').then((key) => {
      cy.uniqueName('first').then((username) => fill(username, key))
      cy.location('pathname').should('eq', '/')
      cy.findByRole('button', { name: 'Sign out' }).click()
      cy.findByRole('alertdialog').within(() => cy.findByRole('button', { name: 'Sign out' }).click())
      cy.location('pathname').should('eq', '/sign-in')

      cy.visit('/sign-up')
      cy.uniqueName('second').then((username) => fill(username, key))
      cy.findByText(/This invite key is not valid/).should('be.visible')
    })
  })
})
