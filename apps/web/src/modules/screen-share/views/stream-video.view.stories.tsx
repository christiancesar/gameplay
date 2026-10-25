import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

import { StreamVideoView } from './stream-video.view'

const meta = {
  title: 'ScreenShare/StreamVideo',
  component: StreamVideoView,
  decorators: [(Story) => <div className="flex h-64 w-96 items-center justify-center bg-black">{Story()}</div>],
} satisfies Meta<typeof StreamVideoView>

export default meta
type Story = StoryObj<typeof meta>

/** Pedido enviado, o vídeo ainda não chegou. */
export const WaitingForVideo: Story = {
  args: { stream: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(/connecting to the stream/i)
  },
}
