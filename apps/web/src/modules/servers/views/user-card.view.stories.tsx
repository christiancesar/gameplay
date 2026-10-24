import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'

import { me } from '@/fixtures'
import { SharePanelView } from '@/modules/screen-share/views/share-panel.view'
import { SidebarProvider } from '@/shared/ui/sidebar'

import { UserCardView, type UserCardViewProps } from './user-card.view'

const sharePanel = <SharePanelView state={{ status: 'idle' }} onStart={fn()} onStop={fn()} onOpenDetails={fn()} />

const meta = {
  title: 'Servers/UserCard',
  component: UserCardView,
  // Mesmo fundo e largura do rodapé da sidebar.
  decorators: [
    (Story, context) => (
      <SidebarProvider className="min-h-0">
        {context.parameters.wide ? Story() : <div className="bg-sidebar w-72 rounded-lg p-2">{Story()}</div>}
      </SidebarProvider>
    ),
  ],
  args: {
    user: me,
    inRoom: false,
    isMuted: false,
    isDeafened: false,
    sharePanel,
    onOpenSettings: fn(),
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

/** Clicar no usuário abre as configurações do usuário. */
export const OutsideRoom: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^settings:/i }))
    await expect(args.onOpenSettings).toHaveBeenCalledOnce()
  },
}

/** Igual ao Frame 9 do mock. */
export const InRoom: Story = { args: { inRoom: true } }

export const MutedAndDeafened: Story = { args: { inRoom: true, isMuted: true, isDeafened: true } }

export const ToggleVoice: Story = {
  args: { inRoom: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^mute$/i }))
    await userEvent.click(canvas.getByRole('button', { name: /^deafen$/i }))
    await expect(canvas.getByRole('button', { name: /unmute/i })).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: /undeafen/i })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: /leave room/i }))
    await expect(args.onLeaveRoom).toHaveBeenCalledOnce()
  },
}

export const NoAvatar: Story = { args: { user: { ...me, avatarUrl: undefined }, inRoom: true } }

const variants: { title: string; props: Partial<UserCardViewProps> }[] = [
  { title: 'Fora da sala', props: {} },
  { title: 'Na sala', props: { inRoom: true } },
  { title: 'Mutado', props: { inRoom: true, isMuted: true } },
  { title: 'Mutado e sem áudio', props: { inRoom: true, isMuted: true, isDeafened: true } },
]

/** Todas as combinações lado a lado. */
export const Variants: Story = {
  parameters: { wide: true },
  render: (args) => (
    <div className="grid grid-cols-[repeat(auto-fill,18rem)] gap-6">
      {variants.map((variant) => (
        <figure key={variant.title} className="flex flex-col gap-2">
          <figcaption className="text-muted-foreground text-xs">{variant.title}</figcaption>
          <div className="bg-sidebar rounded-lg p-2">
            <UserCardView {...args} {...variant.props} />
          </div>
        </figure>
      ))}
    </div>
  ),
}
