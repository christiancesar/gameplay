import type { Credentials } from '../support/credentials'

type Server = { id: string; name: string }

// F3: server invite link, without and with a session.
describe('Server invite', () => {
  let owner: Credentials
  let signInJoiner: Credentials
  let autoJoiner: Credentials
  let manualJoiner: Credentials
  let autoServer: Server
  let manualServer: Server

  before(() => {
    cy.task<Credentials>('db:createUser', { tag: 'inv-owner' }).then((created) => {
      owner = created
    })
    cy.task<Credentials>('db:createUser', { tag: 'inv-signin' }).then((created) => {
      signInJoiner = created
    })
    cy.task<Credentials>('db:createUser', { tag: 'inv-auto-j' }).then((created) => {
      autoJoiner = created
    })
    cy.task<Credentials>('db:createUser', { tag: 'inv-manual-j' }).then((created) => {
      manualJoiner = created
    })
    cy.then(() => {
      cy.uniqueName('inv-auto').then((name) =>
        cy.task<Server>('db:createServer', { name, ownerId: owner.id, autoApprove: true }).then((s) => {
          autoServer = s
        }),
      )
    })
    cy.then(() => {
      cy.uniqueName('inv-manual').then((name) =>
        cy.task<Server>('db:createServer', { name, ownerId: owner.id, autoApprove: false }).then((s) => {
          manualServer = s
        }),
      )
    })
  })

  function newInvite(server: Server) {
    return cy.task<string>('db:createServerInvite', { serverId: server.id, createdById: owner.id })
  }

  describe('without a session', () => {
    it('sends the visitor to sign up with the invite and joins the server', () => {
      newInvite(autoServer).then((code) => {
        cy.visit(`/i/${code}`)
        cy.findByText(`You were invited to ${autoServer.name}`).should('be.visible')
        cy.findByRole('button', { name: 'Create account' }).click()

        cy.location('pathname').should('eq', '/sign-up')
        cy.location('search').should('contain', `invite=${code}`)
        cy.findByText(autoServer.name).should('be.visible')

        cy.uniqueName('inv-new').then((username) => {
          cy.findByLabelText('Username').type(username)
          cy.findByLabelText('Email').type(`${username}@e2e.test`)
          cy.findByLabelText('Password').type('e2e-pass-123')
          cy.findByLabelText('Confirm password').type('e2e-pass-123')
          cy.task<string>('db:createRegistrationKey').then((key) => cy.findByLabelText('Invite key').type(key))
          cy.findByRole('button', { name: 'Create account' }).click()

          cy.location('pathname').should('eq', '/')
          cy.findByRole('list', { name: 'Your servers' }).should('contain.text', autoServer.name)
          cy.task<{ username: string }[]>('db:getMembers', autoServer.id).then((members) => {
            expect(members.map((member) => member.username)).to.include(username)
          })
        })
      })
    })

    it('offers to sign in and comes back to the invite', () => {
      newInvite(autoServer).then((code) => {
        cy.visit(`/i/${code}`)
        cy.findByRole('button', { name: 'I already have an account' }).click()
        cy.location('pathname').should('eq', '/sign-in')

        cy.findByLabelText('Email or username').type(signInJoiner.email)
        cy.findByLabelText('Password').type(signInJoiner.password)
        cy.findByRole('button', { name: 'Login' }).click()
        cy.location('pathname').should('eq', `/i/${code}`)
        cy.findByText(`Join ${autoServer.name}?`).should('be.visible')
      })
    })

    it('shows an error for an invite that does not exist', () => {
      cy.visit('/i/ZZZZZZZZ')
      cy.findByText("This invite doesn't exist or was revoked.").should('be.visible')
    })
  })

  describe('with a session', () => {
    it('joins right away when the server approves automatically', () => {
      cy.login(autoJoiner)
      newInvite(autoServer).then((code) => {
        cy.visit(`/i/${code}`)
        cy.findByText(`Join ${autoServer.name}?`).should('be.visible')
        cy.findByRole('button', { name: 'Join server' }).click()
        cy.location('pathname').should('eq', `/servers/${autoServer.id}`)
        cy.task<{ username: string }[]>('db:getMembers', autoServer.id).then((members) => {
          expect(members.map((member) => member.username)).to.include(autoJoiner.username)
        })
      })
    })

    it('sends a request and goes back to the Hub when the server needs approval', () => {
      cy.login(manualJoiner)
      newInvite(manualServer).then((code) => {
        cy.visit(`/i/${code}`)
        cy.findByRole('button', { name: 'Join server' }).click()
        cy.findByText('Request sent. Wait for approval.').should('be.visible')
        cy.location('pathname').should('eq', '/')
        cy.findByText(`Request sent to ${manualServer.name}`).should('be.visible')
        cy.findByRole('list', { name: 'Your servers' }).should('not.contain.text', manualServer.name)
        cy.task<{ username: string }[]>('db:getMembers', manualServer.id).then((members) => {
          expect(members.map((member) => member.username)).not.to.include(manualJoiner.username)
        })
      })
    })
  })
})
