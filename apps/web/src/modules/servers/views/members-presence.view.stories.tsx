import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

import { presenceMembers } from '@/fixtures/server'
import { withSidebar } from '@/fixtures/sidebar'
import { Sidebar, SidebarContent } from '@/shared/ui/sidebar'

import { MembersPresenceView } from './members-presence.view'

const meta = {
  title: 'Servers/MembersPresence',
  component: MembersPresenceView,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sidebar variant="inset" collapsible="icon">
        <SidebarContent>
          <Story />
        </SidebarContent>
      </Sidebar>
    ),
    withSidebar,
  ],
  args: { members: presenceMembers },
} satisfies Meta<typeof MembersPresenceView>

export default meta
type Story = StoryObj<typeof meta>

/** Online aberto; offline recolhido até clicar. */
export const MembersOnline: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Online (3)')).toBeVisible()
    await expect(canvas.queryByText('Marreta')).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Offline (2)' }))
    await expect(canvas.getByText('Marreta')).toBeVisible()
  },
}

export const EveryoneOffline: Story = {
  args: { members: presenceMembers.map((member) => ({ ...member, isOnline: false })) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/nobody online/i)).toBeVisible()
  },
}

export const ManyMembers: Story = {
  args: {
    members: [
      ...presenceMembers,
      ...Array.from({ length: 12 }, (_, index) => ({
        id: `p${index}`,
        name: `Player${index + 6}`,
        role: 'member' as const,
        isOnline: index % 3 !== 0,
      })),
    ],
  },
}
