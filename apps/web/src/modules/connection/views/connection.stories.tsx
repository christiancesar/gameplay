import type { Meta, StoryObj } from '@storybook/react-vite'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { expect, screen, waitFor } from 'storybook/test'

import { Button } from '@/shared/ui/button'
import { Toaster } from '@/shared/ui/toaster'

import { ConnectionBannerView } from './connection-banner.view'

const meta = {
  title: 'Connection/DisconnectsAndNotices',
  component: ConnectionBannerView,
  parameters: { layout: 'fullscreen' },
  args: { status: 'reconnecting' },
} satisfies Meta<typeof ConnectionBannerView>

export default meta
type Story = StoryObj<typeof meta>

export const Reconnecting: Story = {}

export const Reconnected: Story = { args: { status: 'reconnected' } }

/** Avisos do F13. Na tela real eles vêm do ViewModel quando chega o evento do Socket.IO. */
export const Notices: Story = {
  render: function Render() {
    const { t } = useTranslation()
    const server = 'Turbex'
    const notices = [
      { label: 'kicked', show: () => toast.error(t('notices.kicked', { server })) },
      { label: 'serverDeleted', show: () => toast.error(t('notices.serverDeleted', { server })) },
      { label: 'promoted', show: () => toast.success(t('notices.promoted', { server })) },
      { label: 'demoted', show: () => toast.info(t('notices.demoted', { server })) },
      { label: 'joinApproved', show: () => toast.success(t('notices.joinApproved', { server })) },
      { label: 'requestSent', show: () => toast.info(t('invite.requestSent')) },
      { label: 'suspended', show: () => toast.error(t('notices.suspended')) },
      { label: 'sessionEnded', show: () => toast.warning(t('notices.sessionEnded')) },
      // room:left com reason 'other-tab' e 'room-deleted'; server:removed 'left' nas outras abas.
      { label: 'roomOtherTab', show: () => toast.info(t('notices.roomOtherTab')) },
      { label: 'roomDeleted', show: () => toast.warning(t('notices.roomDeleted', { room: 'Room 01' })) },
      { label: 'leftServer', show: () => toast.info(t('notices.leftServer', { server })) },
    ]
    return (
      <div className="flex min-h-dvh flex-wrap content-start gap-2 p-6">
        {notices.map((notice) => (
          <Button key={notice.label} variant="outline" onClick={notice.show}>
            {notice.label}
          </Button>
        ))}
        <Toaster
          theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
          position="top-center"
          richColors
        />
      </div>
    )
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'kicked' }))
    await waitFor(() => expect(screen.getByText(/you were removed from turbex/i)).toBeVisible())
    await userEvent.click(canvas.getByRole('button', { name: 'roomOtherTab' }))
    await waitFor(() => expect(screen.getByText(/another tab/i)).toBeVisible())
  },
}
