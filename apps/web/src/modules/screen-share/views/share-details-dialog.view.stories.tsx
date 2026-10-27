import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { viewerQualities } from '@/fixtures/server'

import { ShareDetailsDialogView } from './share-details-dialog.view'

const meta = {
  title: 'ScreenShare/ShareDetailsDialog',
  component: ShareDetailsDialogView,
  args: {
    open: true,
    target: { resolution: '1080p', fps: 60 },
    viewers: viewerQualities,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof ShareDetailsDialogView>

export default meta
type Story = StoryObj<typeof meta>

export const MixedQuality: Story = {}

export const EveryoneOnTarget: Story = { args: { viewers: viewerQualities.slice(0, 1) } }

/** Pelo servidor (SFU): a qualidade vem do que cada espectador informa. */
export const ThroughServer: Story = {
  args: { mode: 'sfu' },
  play: async () => {
    await waitFor(() => expect(screen.getByText(/hands each viewer the layer/i)).toBeVisible())
  },
}
