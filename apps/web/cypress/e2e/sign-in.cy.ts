import type { Credentials } from '../support/credentials'

// F1: sign in by email or username.
describe('Sign in', () => {
  let user: Credentials

  before(() => {
    cy.task<Credentials>('db:createUser', { tag: 'signin' }).then((created) => {
      user = created
    })
  })

  beforeEach(() => {
    cy.visit('/sign-in')
  })

  function submit(identifier: string, password: string) {
    cy.findByLabelText('Email or username').type(identifier)
    cy.findByLabelText('Password').type(password)
    cy.findByRole('button', { name: 'Login' }).click()
  }

  it('signs in with the email and lands on the Hub', () => {
    submit(user.email, user.password)
    cy.location('pathname').should('eq', '/')
    cy.findByText('Your servers').should('be.visible')
    cy.findByText(user.username).should('be.visible')
  })

  it('signs in with the username', () => {
    submit(user.username, user.password)
    cy.location('pathname').should('eq', '/')
    cy.findByText(user.email).should('be.visible')
  })

  it('shows an error for a wrong password and stays on the page', () => {
    submit(user.email, 'not-the-password')
    cy.findByText('Invalid credentials. Check your login and password.').should('be.visible')
    cy.location('pathname').should('eq', '/sign-in')
  })

  it('sends a signed out visitor of a protected page to the sign-in', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/sign-in')
  })
})
