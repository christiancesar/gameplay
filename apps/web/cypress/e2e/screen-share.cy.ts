import { createCallFixture } from '../support/call-fixture'
import type { CallFixture } from '../support/call-fixture'

// F7/F8: screen share between two people in a room. The browser captures a fake screen (Chrome flags).
describe('Screen share', () => {
  let call: CallFixture

  const peerTile = () => cy.findByRole('button', { name: `Volume for ${call.peer.username}` })
  const streamVideo = () => cy.get('video[data-stream-video]')

  before(() => {
    createCallFixture('share').then((created) => {
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
    cy.task('bot:joinRoom', call.firstRoom)
    peerTile().should('be.visible')
    cy.waitForMedia()
  })

  describe('when the peer shares', () => {
    beforeEach(() => {
      cy.task('bot:startShare')
    })

    it('shows LIVE on the peer tile and plays the video after Watch', () => {
      peerTile().closest('div.relative').should('contain.text', 'LIVE')
      cy.findByRole('button', { name: 'Watch' }).click()

      cy.location('search').should('contain', 'watch=')
      cy.findByText(`${call.peer.username} is live`).should('be.visible')
      streamVideo().should('exist')
      cy.waitForMedia({ video: true }).then((stats) => {
        expect(stats.videoFramesDecoded).to.be.greaterThan(0)
        expect(stats.videoWidth).to.be.greaterThan(0)
      })
    })

    it('closes the watch view when the peer stops sharing', () => {
      cy.findByRole('button', { name: 'Watch' }).click()
      cy.location('search').should('contain', 'watch=')
      cy.waitForMedia({ video: true })

      cy.task('bot:stopShare')
      cy.location('search').should('not.contain', 'watch=')
      cy.get('video[data-stream-video]').should('not.exist')
      cy.findByText('LIVE').should('not.exist')
    })

    it('stops watching on request and the stream stays available', () => {
      cy.findByRole('button', { name: 'Watch' }).click()
      cy.location('search').should('contain', 'watch=')
      cy.findByRole('button', { name: 'Stop watching' }).click()
      cy.location('search').should('not.contain', 'watch=')
      cy.findByRole('button', { name: 'Watch' }).should('be.visible')
    })
  })

  describe('when I share', () => {
    it('reaches the peer, who gets frames, and stops from the panel', () => {
      cy.findByRole('button', { name: 'Share screen' }).click()
      cy.findByRole('dialog').within(() => cy.findByRole('button', { name: 'Choose and share' }).click())
      cy.findByRole('button', { name: 'Stop sharing' }).should('be.visible')
      cy.findByText('Nobody is watching yet', { exact: false }).should('be.visible')

      cy.task('bot:watch')
      cy.findByText('1 viewer').should('be.visible')
      cy.task<{ videoFramesDecoded: number; videoWidth: number }>('bot:waitForMedia', { video: true }).then((stats) => {
        expect(stats.videoFramesDecoded).to.be.greaterThan(0)
        expect(stats.videoWidth).to.be.greaterThan(0)
      })
      cy.task<string>('bot:url').should('contain', 'watch=')

      cy.findByRole('button', { name: 'Stop sharing' }).click()
      cy.findByRole('button', { name: 'Share screen' }).should('be.visible')
      cy.task<string>('bot:url').should('not.contain', 'watch=')
    })
  })
})
