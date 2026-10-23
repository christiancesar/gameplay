import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

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
