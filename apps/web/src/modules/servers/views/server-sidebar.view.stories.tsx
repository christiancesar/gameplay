import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { me } from '@/fixtures'
import { roomsWithMe, roomsWithoutMe, turbex } from '@/fixtures/server'

import { ServerSidebarView } from './server-sidebar.view'
import { UserCardView } from './user-card.view'

const userCard = (
  <UserCardView
    user={me}
    serverName="Turbex"
    role="owner"
    pendingRequests={0}
    inRoom={false}
    isMuted={false}
    isDeafened={false}
    onOpenServerSettings={fn()}
    onLeaveServer={fn()}
    onToggleMute={fn()}
    onToggleDeafen={fn()}
    onLeaveRoom={fn()}
  />
)

const meta = {
  title: 'Servers/ServerSidebar',
  component: ServerSidebarView,
  decorators: [(Story) => <div className="h-[44rem]">{Story()}</div>],
  args: {
    server: turbex,
    rooms: roomsWithoutMe,
    userCard,
    onSelectRoom: fn(),
    onBackToHub: fn(),
  },
} satisfies Meta<typeof ServerSidebarView>

export default meta
type Story = StoryObj<typeof meta>

export const NotInRoom: Story = {}

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
