import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, fn } from 'storybook/test'

import { images } from '@/fixtures'
import { stageLongNames, stageWithLive } from '@/fixtures/server'

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

/** Sideways phone: the bar and the people float over the video, and a tap on the video hides them. */
export const PhoneLandscape: Story = {
  args: { sidebarTrigger: <button type="button">Sidebar</button> },
  globals: { viewport: { value: 'mobile1', isRotated: true } },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-controls]')
    await expect(root).toHaveAttribute('data-controls', 'shown')
    // Only shown on a sideways phone; the test runner's viewport may not be one, so the click goes straight in.
    const toggle = canvasElement.querySelector('button[aria-label="Show or hide controls"]')
    await expect(toggle).not.toBeNull()
    await fireEvent.click(toggle as HTMLButtonElement)
    await expect(root).toHaveAttribute('data-controls', 'hidden')
  },
}

export const LongNames: Story = { args: { participants: stageLongNames } }

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
