import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, waitFor, within } from 'storybook/test'

import { me } from '@/fixtures'
import { roomsWithMe, roomsWithoutMe, turbex } from '@/fixtures/server'

import { ServerSidebarView } from './server-sidebar.view'
import { UserCardView } from './user-card.view'

const userCard = (
  <UserCardView user={me} inRoom={false} isMuted={false} isDeafened={false} onOpenSettings={fn()} onToggleMute={fn()} onToggleDeafen={fn()} onLeaveRoom={fn()} />
)

const meta = {
  title: 'Servers/ServerSidebar',
  component: ServerSidebarView,
  decorators: [(Story) => <div className="h-[44rem]">{Story()}</div>],
  args: {
    server: turbex,
    role: 'owner',
    pendingRequests: 0,
    rooms: roomsWithoutMe,
    userCard,
    onSelectRoom: fn(),
    onBackToHub: fn(),
    onOpenServerSettings: fn(),
    onLeaveServer: fn(),
  },
} satisfies Meta<typeof ServerSidebarView>

export default meta
type Story = StoryObj<typeof meta>

/** Owner/admin: clicar no card do servidor abre o modal do servidor. */
export const Owner: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /server settings: turbex/i }))
    await expect(args.onOpenServerSettings).toHaveBeenCalledOnce()
  },
}

export const OwnerWithPendingRequests: Story = { args: { pendingRequests: 3 } }

export const Admin: Story = { args: { role: 'admin' } }

/** Member: no lugar da engrenagem, o ícone de sair do servidor (com confirmação). */
export const Member: Story = {
  args: { role: 'member' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /leave server/i }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /^leave$/i }))
    await waitFor(() => expect(args.onLeaveServer).toHaveBeenCalledOnce())
  },
}

export const InRoom: Story = { args: { rooms: roomsWithMe, currentRoomId: 'r1' } }

export const NoRooms: Story = { args: { rooms: [] } }

export const ManyRooms: Story = {
  args: {
    rooms: [
      ...roomsWithoutMe,
      ...Array.from({ length: 6 }, (_, index) => ({ id: `x${index}`, name: `Room ${String(index + 3).padStart(2, '0')}`, participants: [] })),
    ],
  },
}

export const NoServerIcon: Story = { args: { server: { ...turbex, iconUrl: undefined } } }

export const SelectRoomAndGoBack: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /join room 02/i }))
    await expect(args.onSelectRoom).toHaveBeenCalledWith('r2')
    await userEvent.click(canvas.getByRole('button', { name: /back to hub/i }))
    await expect(args.onBackToHub).toHaveBeenCalledOnce()
  },
}
