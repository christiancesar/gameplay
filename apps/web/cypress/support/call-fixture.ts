import type { Credentials } from './credentials'

type CallFixture = {
  /** The user Cypress signs in as. */
  me: Credentials
  /** The user the peer bot signs in as. */
  peer: Credentials
  serverId: string
  /** `Room 1`, the room every server starts with. */
  firstRoom: string
  secondRoom: string
}

/** Two users in one server with two voice rooms, created through the db tasks and removed by the run cleanup. */
function createCallFixture(tag: string): Cypress.Chainable<CallFixture> {
  const fixture = { firstRoom: 'Room 1', secondRoom: 'Room 2' } as CallFixture
  cy.task<Credentials>('db:createUser', { tag: `${tag}-me` }).then((user) => {
    fixture.me = user
  })
  cy.task<Credentials>('db:createUser', { tag: `${tag}-peer` }).then((user) => {
    fixture.peer = user
  })
  cy.uniqueName(`${tag}-srv`).then((name) =>
    cy.task<{ id: string }>('db:createServer', { name, ownerId: fixture.me.id }).then((server) => {
      fixture.serverId = server.id
    }),
  )
  cy.then(() => cy.task('db:addMember', { serverId: fixture.serverId, userId: fixture.peer.id }))
  cy.then(() => cy.task('db:createRoom', { serverId: fixture.serverId, name: fixture.secondRoom, position: 1 }))
  return cy.then(() => fixture)
}

export { createCallFixture }
export type { CallFixture }
