import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { servers } from '@/fixtures'

import { InviteLandingView } from './invite-landing.view'

const server = { name: servers.turbex.name, iconUrl: servers.turbex.iconUrl, memberCount: 6, isFull: false }

const meta = {
  title: 'Invites/InviteLanding',
  component: InviteLandingView,
  parameters: { layout: 'fullscreen' },
  args: {
    state: { status: 'signedOut', server },
    onCreateAccount: fn(),
    onSignIn: fn(),
    onJoin: fn(),
    onOpenServer: fn(),
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

/** Servidor cheio não bloqueia: o pedido fica esperando uma vaga. */
export const ConfirmJoinServerFull: Story = {
  args: { state: { status: 'confirm', server: { ...server, memberCount: 10, isFull: true }, isJoining: false } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText(/wait for a free spot/i)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /join server/i }))
    await expect(args.onJoin).toHaveBeenCalledOnce()
  },
}

/** Quem já é membro abre o servidor direto, sem gastar o convite. */
export const AlreadyMember: Story = {
  args: { state: { status: 'alreadyMember', server } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /open server/i }))
    await expect(args.onOpenServer).toHaveBeenCalledOnce()
  },
}

export const Joining: Story = { args: { state: { status: 'confirm', server, isJoining: true } } }

export const NoServerIcon: Story = {
  args: { state: { status: 'confirm', server: { ...server, iconUrl: undefined }, isJoining: false } },
}

export const Expired: Story = { args: { state: { status: 'error', error: 'expired' } } }
export const AlreadyUsed: Story = { args: { state: { status: 'error', error: 'exhausted' } } }
export const RequestPending: Story = { args: { state: { status: 'error', error: 'requestPending' } } }
export const NotFound: Story = { args: { state: { status: 'error', error: 'notFound' } } }
