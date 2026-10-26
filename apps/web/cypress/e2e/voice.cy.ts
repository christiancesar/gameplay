import { createCallFixture } from '../support/call-fixture'
import type { CallFixture } from '../support/call-fixture'

// F5/F6: voice rooms with a second participant (the peer bot, a headless Chromium with a fake microphone).
describe('Voice rooms', () => {
  let call: CallFixture

  const peerTile = () => cy.findByRole('button', { name: `Volume for ${call.peer.username}` })

  before(() => {
    createCallFixture('voice').then((created) => {
      call = created
      cy.task('bot:start', { user: call.peer, serverId: call.serverId })
    })
  })

  after(() => {
    cy.task('bot:stop')
  })

  beforeEach(() => {
    cy.task('bot:leaveRoom')
    cy.login(call.me)
    cy.visit(`/servers/${call.serverId}`)
    cy.findByRole('button', { name: `Join ${call.firstRoom}` }).click()
    cy.findByRole('button', { name: `${call.firstRoom}, You are here` }).should('be.visible')
  })

  it('shows both people on the stage and carries audio both ways', () => {
    cy.task('bot:joinRoom', call.firstRoom)

    peerTile().should('be.visible')
    cy.findByText('Connecting…').should('not.exist')
    cy.waitForMedia().then((stats) => {
      expect(stats.audioInboundBytes).to.be.greaterThan(0)
    })
    cy.task<{ connectionStates: string[]; audioInboundBytes: number }>('bot:waitForMedia', {}).then((stats) => {
      expect(stats.connectionStates).to.deep.equal(['connected'])
      expect(stats.audioInboundBytes).to.be.greaterThan(0)
    })
  })

  it('shows the peer as muted and clears it when they unmute', () => {
    cy.task('bot:joinRoom', call.firstRoom)
    peerTile().should('be.visible')

    cy.task('bot:mute', true)
    peerTile().within(() => cy.findByRole('img', { name: 'Muted' }).should('be.visible'))

    cy.task('bot:mute', false)
    peerTile().within(() => cy.findByRole('img', { name: 'Muted' }).should('not.exist'))
  })

  it('removes the tile when the peer leaves the room', () => {
    cy.task('bot:joinRoom', call.firstRoom)
    peerTile().should('be.visible')

    cy.task('bot:leaveRoom')
    peerTile().should('not.exist')
  })

  it('moves between rooms and only shows the people in the current one', () => {
    cy.task('bot:joinRoom', call.secondRoom)
    peerTile().should('not.exist')

    cy.findByRole('button', { name: `Join ${call.secondRoom}` }).click()
    cy.findByRole('button', { name: `${call.secondRoom}, You are here` }).should('be.visible')
    peerTile().should('be.visible')
    cy.findByRole('button', { name: `Join ${call.firstRoom}` }).should('be.visible')

    cy.task('bot:leaveRoom')
    cy.task('bot:joinRoom', call.firstRoom)
    peerTile().should('not.exist')

    cy.findByRole('button', { name: `Join ${call.firstRoom}` }).click()
    peerTile().should('be.visible')
    cy.waitForMedia()
  })

  it('leaves the room from the user card', () => {
    cy.findByRole('button', { name: 'Leave room' }).click()
    cy.findByRole('button', { name: 'Leave room' }).should('not.exist')
    cy.findByRole('button', { name: `Join ${call.firstRoom}` }).should('be.visible')
  })
})
