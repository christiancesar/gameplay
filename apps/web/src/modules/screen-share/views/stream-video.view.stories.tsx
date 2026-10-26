import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, waitFor } from 'storybook/test'

import { StreamVideoView } from './stream-video.view'

const meta = {
  title: 'ScreenShare/StreamVideo',
  component: StreamVideoView,
  decorators: [(Story) => <div className="flex h-64 w-96 items-center justify-center bg-black">{Story()}</div>],
} satisfies Meta<typeof StreamVideoView>

export default meta
type Story = StoryObj<typeof meta>

/** Pedido enviado, o vídeo ainda não chegou. */
/** A live stream from a canvas: pausing it (media keys, picture in picture) plays it again. */
export const PlayingCannotPause: Story = {
  args: { stream: null },
  render: function Render() {
    const [stream] = useState(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180
      const context = canvas.getContext('2d')
      if (context) {
        context.fillStyle = '#10b981'
        context.fillRect(0, 0, 320, 180)
      }
      return canvas.captureStream(10)
    })
    return <StreamVideoView stream={stream} />
  },
  play: async ({ canvasElement }) => {
    const video = canvasElement.querySelector('video') as HTMLVideoElement
    await waitFor(() => expect(video.paused).toBe(false))
    video.pause()
    await waitFor(() => expect(video.paused).toBe(false))
  },
}

export const WaitingForVideo: Story = {
  args: { stream: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(/connecting to the stream/i)
  },
}
