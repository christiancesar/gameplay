import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { me } from '@/fixtures'
import { SharePanelView } from '@/modules/screen-share/views/share-panel.view'

import { UserCardView, type UserCardViewProps } from './user-card.view'

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
  decorators: [(Story, context) => (context.parameters.wide ? Story() : <div className="w-72">{Story()}</div>)],
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
  render: function Render(args) {
    // Mute e deafen alternam de verdade para ver os ícones mudarem.
    const [isMuted, setMuted] = useState(args.isMuted)
    const [isDeafened, setDeafened] = useState(args.isDeafened)
    return (
      <UserCardView
        {...args}
        isMuted={isMuted}
        isDeafened={isDeafened}
        onToggleMute={() => {
          args.onToggleMute()
          setMuted((value) => !value)
        }}
        onToggleDeafen={() => {
          args.onToggleDeafen()
          setDeafened((value) => !value)
        }}
      />
    )
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
    await expect(canvas.getByRole('button', { name: /unmute/i })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: /undeafen/i })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: /leave room/i }))
    await expect(args.onToggleMute).toHaveBeenCalledOnce()
    await expect(args.onToggleDeafen).toHaveBeenCalledOnce()
    await expect(args.onLeaveRoom).toHaveBeenCalledOnce()
  },
}

export const Member: Story = { args: { role: 'member' } }

/** Member numa sala: ícone de sair do servidor no lugar da engrenagem, mais os controles de voz. */
export const MemberInRoom: Story = { args: { role: 'member', inRoom: true } }

export const AdminInRoom: Story = { args: { role: 'admin', inRoom: true, pendingRequests: 1 } }

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

const variants: { title: string; props: Partial<UserCardViewProps> }[] = [
  { title: 'Owner, fora da sala', props: {} },
  { title: 'Owner, na sala', props: { inRoom: true } },
  { title: 'Owner, pedidos pendentes', props: { inRoom: true, pendingRequests: 3 } },
  { title: 'Admin, na sala', props: { role: 'admin', inRoom: true } },
  { title: 'Member, fora da sala', props: { role: 'member' } },
  { title: 'Member, na sala', props: { role: 'member', inRoom: true } },
  { title: 'Mutado', props: { role: 'member', inRoom: true, isMuted: true } },
  { title: 'Mutado e sem áudio', props: { role: 'member', inRoom: true, isMuted: true, isDeafened: true } },
]

/** Todas as combinações lado a lado. */
export const Variants: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className="grid grid-cols-[repeat(auto-fill,18rem)] gap-6">
      {variants.map((variant) => (
        <figure key={variant.title} className="flex flex-col gap-2">
          <figcaption className="text-muted-foreground text-xs">{variant.title}</figcaption>
          <UserCardView {...args} {...variant.props} />
        </figure>
      ))}
    </div>
  ),
}
