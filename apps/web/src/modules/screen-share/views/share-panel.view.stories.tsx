import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'

import { liveStats } from '@/fixtures/server'

import { SharePanelView } from './share-panel.view'

const meta = {
  title: 'ScreenShare/SharePanel',
  component: SharePanelView,
  decorators: [(Story) => <div className="w-66">{Story()}</div>],
  args: {
    state: { status: 'idle' },
    onStart: fn(),
    onPresetChange: fn(),
    onIncludeAudioChange: fn(),
    onConfirm: fn(),
    onCancel: fn(),
    onStop: fn(),
  },
} satisfies Meta<typeof SharePanelView>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /share screen/i }))
    await expect(args.onStart).toHaveBeenCalledOnce()
  },
}

export const Configuring: Story = {
  args: { state: { status: 'configuring', preset: '1080p60', includeAudio: true } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('switch', { name: /include audio/i }))
    await expect(args.onIncludeAudioChange).toHaveBeenCalledWith(false)
    await userEvent.click(canvas.getByRole('button', { name: /choose screen/i }))
    await expect(args.onConfirm).toHaveBeenCalledOnce()
  },
}

export const WaitingBrowserPicker: Story = { args: { state: { status: 'picking' } } }

export const Live: Story = {
  args: { state: { status: 'live', preset: '1080p60', stats: liveStats, viewers: 3, degraded: false } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('8.4 Mbps')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /stop sharing/i }))
    await expect(args.onStop).toHaveBeenCalledOnce()
  },
}

export const LiveNoViewers: Story = {
  args: { state: { status: 'live', preset: '720p30', stats: { ...liveStats, uploadKbps: 120, fps: 30, width: 1280, height: 720 }, viewers: 0, degraded: false } },
}

export const LiveDegraded: Story = {
  args: {
    state: { status: 'live', preset: '1080p60', stats: { ...liveStats, uploadKbps: 2100, fps: 24.3 }, viewers: 4, degraded: true },
  },
}
