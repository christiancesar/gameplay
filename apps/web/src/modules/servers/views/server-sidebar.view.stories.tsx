import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor, within } from 'storybook/test'

import { me } from '@/fixtures'
import { myServers, presenceMembers, roomsWithMe, roomsWithoutMe, turbex } from '@/fixtures/server'
import { withSidebar } from '@/fixtures/sidebar'

import { MembersPresenceView } from './members-presence.view'
import { ServerSidebarView } from './server-sidebar.view'
import { UserCardView } from './user-card.view'

const userCard = (
  <UserCardView
    user={me}
    inRoom={false}
    isMuted={false}
    isDeafened={false}
    onOpenSettings={fn()}
    onToggleMute={fn()}
    onToggleDeafen={fn()}
    onLeaveRoom={fn()}
  />
)

const meta = {
  title: 'Servers/ServerSidebar',
  component: ServerSidebarView,
  parameters: { layout: 'fullscreen' },
  decorators: [withSidebar],
  args: {
    server: turbex,
    servers: myServers,
    currentServerId: turbex.id,
    role: 'owner',
    pendingRequests: 0,
    rooms: roomsWithoutMe,
    userCard,
    members: <MembersPresenceView members={presenceMembers} />,
    onSelectRoom: fn(),
    onBackToHub: fn(),
    onSelectServer: fn(),
    onConfirmSwitch: fn(),
    onDismissSwitch: fn(),
    onOpenServerSettings: fn(),
    onLeaveServer: fn(),
  },
  render: function Render(args) {
    // Simula o ViewModel: conectado numa sala, trocar de servidor pede confirmação.
    const [pendingSwitch, setPendingSwitch] = useState(args.pendingSwitch)
    return (
      <ServerSidebarView
        {...args}
        pendingSwitch={pendingSwitch}
        onSelectServer={(serverId) => {
          args.onSelectServer(serverId)
          const target = args.servers.find((item) => item.id === serverId)
          const room = args.rooms.find((item) => item.id === args.currentRoomId)
          if (target && room) setPendingSwitch({ serverName: target.name, roomName: room.name })
        }}
        onDismissSwitch={() => {
          args.onDismissSwitch()
          setPendingSwitch(undefined)
        }}
      />
    )
  },
} satisfies Meta<typeof ServerSidebarView>

export default meta
type Story = StoryObj<typeof meta>

/** Owner/admin: o seletor do servidor tem busca, troca de servidor e as configurações do servidor. */
export const Owner: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /switch server: turbex/i }))
    await userEvent.click(await screen.findByRole('option', { name: /server settings/i }))
    await expect(args.onOpenServerSettings).toHaveBeenCalledOnce()
  },
}

export const OwnerWithPendingRequests: Story = { args: { pendingRequests: 3 } }

export const Admin: Story = { args: { role: 'admin' } }

/** Member: no seletor, "Sair do servidor" com confirmação. */
export const Member: Story = {
  args: { role: 'member' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /switch server: turbex/i }))
    await userEvent.click(await screen.findByRole('option', { name: /leave server/i }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /^leave$/i }))
    await waitFor(() => expect(args.onLeaveServer).toHaveBeenCalledOnce())
  },
}

/** Busca pelo nome; fora de sala, trocar de servidor não pede confirmação. */
export const SearchAndSwitch: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /switch server: turbex/i }))
    await userEvent.type(await screen.findByPlaceholderText(/search servers/i), 'sexta')
    await expect(screen.queryByRole('option', { name: /clan zero/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: /sexta feira/i }))
    await expect(args.onSelectServer).toHaveBeenCalledWith('s3')
    await expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  },
}

/** Conectado numa sala: trocar de servidor avisa que vai desconectar. Cancelar mantém tudo como está. */
export const SwitchWhileInRoom: Story = {
  args: { rooms: roomsWithMe, currentRoomId: 'r1' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /switch server: turbex/i }))
    await userEvent.click(await screen.findByRole('option', { name: /clan zero/i }))
    const dialog = await screen.findByRole('alertdialog')
    await waitFor(() => expect(within(dialog).getByText(/switch to clan zero/i)).toBeVisible())
    await userEvent.click(within(dialog).getByRole('button', { name: /cancel/i }))
    await waitFor(() => expect(args.onDismissSwitch).toHaveBeenCalledOnce())
    await expect(args.onConfirmSwitch).not.toHaveBeenCalled()
  },
}

export const ConfirmSwitch: Story = {
  args: { rooms: roomsWithMe, currentRoomId: 'r1', pendingSwitch: { serverName: 'Clan Zero', roomName: 'Room 01' } },
  play: async ({ args, userEvent }) => {
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /disconnect and switch/i }))
    await waitFor(() => expect(args.onConfirmSwitch).toHaveBeenCalledOnce())
  },
}

export const InRoom: Story = { args: { rooms: roomsWithMe, currentRoomId: 'r1' } }

export const Collapsed: Story = {
  args: { rooms: roomsWithMe, currentRoomId: 'r1', pendingRequests: 3 },
  parameters: { sidebarCollapsed: true },
}

export const NoRooms: Story = { args: { rooms: [] } }

export const ManyRooms: Story = {
  args: {
    rooms: [
      ...roomsWithoutMe,
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `x${index}`,
        name: `Room ${String(index + 3).padStart(2, '0')}`,
        participants: [],
      })),
    ],
  },
}

export const NoServerIcon: Story = { args: { server: { ...turbex, iconUrl: undefined } } }

/** O logo volta ao Hub sem desconectar. */
export const SelectRoomAndGoBack: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /join room 02/i }))
    await expect(args.onSelectRoom).toHaveBeenCalledWith('r2')
    await userEvent.click(canvas.getByRole('button', { name: /back to hub/i }))
    await expect(args.onBackToHub).toHaveBeenCalledOnce()
  },
}
