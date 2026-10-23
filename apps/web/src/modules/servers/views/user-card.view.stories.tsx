import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { me } from '@/fixtures'
import { SharePanelView } from '@/modules/screen-share/views/share-panel.view'

import { UserCardView } from './user-card.view'

const sharePanel = (
  <SharePanelView
    state={{ status: 'idle' }}
    onStart={fn()}
    onPresetChange={fn()}
    onIncludeAudioChange={fn()}
    onConfirm={fn()}
    onCancel={fn()}
    onStop={fn()}
  />
)

const meta = {
  title: 'Servers/UserCard',
  component: UserCardView,
  decorators: [(Story) => <div className="w-72">{Story()}</div>],
  args: {
    user: me,
    serverName: 'Turbex',
    role: 'owner',
    pendingRequests: 0,
    inRoom: false,
    isMuted: false,
    isDeafened: false,
    sharePanel,
    onOpenServerSettings: fn(),
    onLeaveServer: fn(),
    onToggleMute: fn(),
    onToggleDeafen: fn(),
    onLeaveRoom: fn(),
  },
} satisfies Meta<typeof UserCardView>

export default meta
type Story = StoryObj<typeof meta>

export const OwnerOutsideRoom: Story = {}

/** Igual ao Frame 9 do mock. */
export const OwnerInRoom: Story = { args: { inRoom: true } }

export const OwnerWithPendingRequests: Story = {
  args: { pendingRequests: 3 },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /server settings, 3 pending requests/i }))
    await expect(args.onOpenServerSettings).toHaveBeenCalledOnce()
  },
}

export const MutedAndDeafened: Story = { args: { inRoom: true, isMuted: true, isDeafened: true } }

export const ToggleVoice: Story = {
  args: { inRoom: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^mute$/i }))
    await userEvent.click(canvas.getByRole('button', { name: /^deafen$/i }))
    await userEvent.click(canvas.getByRole('button', { name: /leave room/i }))
    await expect(args.onToggleMute).toHaveBeenCalledOnce()
    await expect(args.onToggleDeafen).toHaveBeenCalledOnce()
    await expect(args.onLeaveRoom).toHaveBeenCalledOnce()
  },
}

export const Member: Story = { args: { role: 'member' } }

export const MemberLeavesServer: Story = {
  args: { role: 'member' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /leave server/i }))
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeVisible())
    await userEvent.click(screen.getByRole('button', { name: /^leave$/i }))
    await expect(args.onLeaveServer).toHaveBeenCalledOnce()
  },
}

export const NoAvatar: Story = { args: { user: { ...me, avatarUrl: undefined }, inRoom: true } }
