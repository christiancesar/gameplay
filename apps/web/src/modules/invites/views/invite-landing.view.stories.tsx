import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { servers } from '@/fixtures'

import { InviteLandingView } from './invite-landing.view'

const server = { name: servers.turbex.name, iconUrl: servers.turbex.iconUrl, memberCount: 6 }

const meta = {
  title: 'Invites/InviteLanding',
  component: InviteLandingView,
  parameters: { layout: 'fullscreen' },
  args: {
    state: { status: 'signedOut', server },
    onCreateAccount: fn(),
    onSignIn: fn(),
    onJoin: fn(),
    onBackToHub: fn(),
  },
} satisfies Meta<typeof InviteLandingView>

export default meta
type Story = StoryObj<typeof meta>

/** Sem sessão: leva ao cadastro (com a key) ou ao login. */
export const SignedOut: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /create account/i }))
    await expect(args.onCreateAccount).toHaveBeenCalledOnce()
  },
}

export const ConfirmJoin: Story = { args: { state: { status: 'confirm', server, isJoining: false } } }

export const Joining: Story = { args: { state: { status: 'confirm', server, isJoining: true } } }

export const NoServerIcon: Story = {
  args: { state: { status: 'confirm', server: { ...server, iconUrl: undefined }, isJoining: false } },
}

export const Expired: Story = { args: { state: { status: 'error', error: 'expired' } } }
export const AlreadyUsed: Story = { args: { state: { status: 'error', error: 'exhausted' } } }
export const ServerFull: Story = { args: { state: { status: 'error', error: 'serverFull' } } }
export const NotFound: Story = { args: { state: { status: 'error', error: 'notFound' } } }
