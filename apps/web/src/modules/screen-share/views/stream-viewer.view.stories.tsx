import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { images } from '@/fixtures'
import { stageWithLive } from '@/fixtures/server'

import { StreamViewerView } from './stream-viewer.view'

const meta = {
  title: 'ScreenShare/StreamViewer',
  component: StreamViewerView,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="h-dvh">{Story()}</div>],
  args: {
    streamerName: 'Kisnaider',
    video: <img src={images.streamFrame} alt="" className="max-h-full max-w-full object-contain" />,
    liveStreams: [{ id: 'u3', name: 'Kisnaider' }],
    currentStreamId: 'u3',
    streamVolume: 80,
    participants: stageWithLive,
    onSwitchStream: fn(),
    onStopWatching: fn(),
    onFullscreen: fn(),
    onStreamVolumeChange: fn(),
    onWatch: fn(),
    onVolumeChange: fn(),
  },
} satisfies Meta<typeof StreamViewerView>

export default meta
type Story = StoryObj<typeof meta>

export const Watching: Story = {}

export const MultipleStreams: Story = {
  args: {
    liveStreams: [
      { id: 'u3', name: 'Kisnaider' },
      { id: 'u4', name: 'Marreta' },
    ],
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Marreta' }))
    await expect(args.onSwitchStream).toHaveBeenCalledWith('u4')
  },
}

export const StopWatching: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /stop watching/i }))
    await expect(args.onStopWatching).toHaveBeenCalledOnce()
  },
}
