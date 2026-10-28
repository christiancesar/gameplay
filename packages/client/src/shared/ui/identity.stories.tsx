import type { Meta, StoryObj } from '@storybook/react-vite'

import avatarShinigame from '@/fixtures/images/avatar-shinigame.webp'
import serverTurbex from '@/fixtures/images/server-turbex.webp'

import { ServerIcon } from './server-icon'
import { UserAvatar } from './user-avatar'

const meta = {
  title: 'Shared/UI/Identity',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <UserAvatar name="Shinigame" imageUrl={avatarShinigame} size="xl" />
      <UserAvatar name="Shinigame" imageUrl={avatarShinigame} size="lg" />
      <UserAvatar name="Jacutinga" size="lg" />
      <UserAvatar name="Kis Naider" />
      <UserAvatar name="Kisnaider" size="sm" />
    </div>
  ),
}

export const ServerIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ServerIcon name="Turbex" imageUrl={serverTurbex} className="size-10" />
      <ServerIcon name="Turbex" imageUrl={serverTurbex} />
      <ServerIcon name="Clan Zero" className="size-10 text-sm" />
      <ServerIcon name="Clan Zero" />
    </div>
  ),
}
