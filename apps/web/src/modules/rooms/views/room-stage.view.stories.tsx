import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { stage, stageConnecting, stageWithLive } from '@/fixtures/server'

import { RoomStageView } from './room-stage.view'

const meta = {
  title: 'Rooms/RoomStage',
  component: RoomStageView,
  args: {
    roomName: 'Room 01',
    participants: stage,
    micDenied: false,
    onWatch: fn(),
    onVolumeChange: fn(),
  },
} satisfies Meta<typeof RoomStageView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Alone: Story = { args: { participants: [stage[0]] } }

export const WithLiveStreams: Story = {
  args: { participants: stageWithLive },
  play: async ({ args, canvas, userEvent }) => {
    const watchButtons = canvas.getAllByRole('button', { name: /^watch$/i })
    await expect(watchButtons).toHaveLength(2)
    await userEvent.click(watchButtons[0])
    await expect(args.onWatch).toHaveBeenCalledWith('u3')
  },
}

export const ConnectingAndFailed: Story = { args: { participants: stageConnecting } }

export const MicrophoneDenied: Story = { args: { micDenied: true } }

export const AdjustVolume: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /volume for jacutinga/i }))
    const slider = await waitFor(() => screen.getByRole('slider', { name: /volume for jacutinga/i }))
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onVolumeChange).toHaveBeenCalledWith('u2', 105)
  },
}
