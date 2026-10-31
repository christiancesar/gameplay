import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, within } from 'storybook/test'

import { me, servers } from '@/fixtures'
import { languageOptions, useStoryLanguage } from '@/fixtures/language'
import { useStoryTheme } from '@/fixtures/theme'

import { NotificationsPanelView } from '@/modules/notifications/views/notifications-panel.view'
import type { HubNotification } from '@/modules/notifications/model/entities/hub-notification'

import { HubView, type HubJoinError } from './hub.view'

const meta = {
  title: 'Hub/Hub',
  component: HubView,
  parameters: { layout: 'fullscreen' },
  args: {
    user: me,
    isPlatformAdmin: false,
    servers: [servers.turbex],
    isLoadingServers: false,
    canCreateServer: true,
    showPublicHome: true,
    isJoining: false,
    theme: 'dark',
    language: 'en',
    languageOptions,
    onOpenServer: fn(),
    onCreateServer: fn(),
    onJoin: fn(),
    onOpenAdmin: fn(),
    onOpenPublic: fn(),
    onOpenSettings: fn(),
    isSigningOut: false,
    onSignOut: fn(),
    onToggleTheme: fn(),
    onLanguageChange: fn(),
  },
  render: function Render(args) {
    const language = useStoryLanguage()
    const theme = useStoryTheme()
    return <HubView {...args} {...language} {...theme} />
  },
} satisfies Meta<typeof HubView>

export default meta
type Story = StoryObj<typeof meta>

/** Igual ao mock home-logado.png. */
export const Default: Story = { args: { defaultJoinCode: 'JH34SD32' } }

export const FirstAccess: Story = { args: { servers: [] } }

export const ManyServers: Story = {
  args: { servers: [servers.turbex, servers.clanZero, servers.sextaFeira] },
}

export const LoadingServers: Story = { args: { isLoadingServers: true } }

export const ServerLimitReached: Story = {
  args: { canCreateServer: false },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /create your server/i })).toBeDisabled()
  },
}

export const PlatformAdmin: Story = {
  args: { isPlatformAdmin: true },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /platform admin/i }))
    await expect(args.onOpenAdmin).toHaveBeenCalledOnce()
  },
}

export const NoAvatar: Story = { args: { user: { ...me, avatarUrl: undefined } } }

export const Joining: Story = { args: { defaultJoinCode: 'JH34SD32', isJoining: true } }

export const JoinInviteExpired: Story = { args: { defaultJoinCode: 'JH34SD32', joinError: 'inviteExpired' } }

/** Já existe um pedido esperando aprovação nesse servidor. */
export const JoinRequestPending: Story = { args: { defaultJoinCode: 'JH34SD32', joinError: 'requestPending' } }

/** Simula o ViewModel: o servidor recusa o código e o erro some quando o usuário edita o campo. */
export const JoinErrorClearsOnEdit: Story = {
  render: function Render(args) {
    const [joinError, setJoinError] = useState<HubJoinError>()
    const language = useStoryLanguage()
    const theme = useStoryTheme()
    return (
      <HubView
        {...args}
        {...language}
        {...theme}
        joinError={joinError}
        onJoin={(code) => {
          args.onJoin(code)
          setJoinError('inviteNotFound')
        }}
      />
    )
  },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByLabelText(/invite code/i)
    await userEvent.type(input, 'zzzz2222')
    await userEvent.click(canvas.getByRole('button', { name: /join/i }))
    await expect(args.onJoin).toHaveBeenCalledWith('ZZZZ2222')
    await expect(await canvas.findByText(/invite not found/i)).toBeVisible()

    await userEvent.type(input, '{Backspace}3')
    await expect(canvas.queryByText(/invite not found/i)).not.toBeInTheDocument()
  },
}

export const OpenServer: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Turbex' }))
    await expect(args.onOpenServer).toHaveBeenCalledWith('s1')
  },
}

export const JoinByCode: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const join = canvas.getByRole('button', { name: /join/i })
    await expect(join).toBeDisabled()
    await userEvent.type(canvas.getByLabelText(/invite code/i), 'jh34sd32')
    await userEvent.click(join)
    await expect(args.onJoin).toHaveBeenCalledWith('JH34SD32')
  },
}

/** Colar o link inteiro também funciona: fica só o código. */
export const JoinByLink: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/invite code/i), 'https://gameplay.app/i/jh34sd32')
    await userEvent.click(canvas.getByRole('button', { name: /join/i }))
    await expect(args.onJoin).toHaveBeenCalledWith('JH34SD32')
  },
}

/** Formato errado nem chega no servidor: 8 caracteres, sem 0/O e 1/I. */
export const JoinInvalidCode: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/invite code/i), 'abc')
    await userEvent.click(canvas.getByRole('button', { name: /join/i }))
    await expect(await canvas.findByText(/8 letters or numbers/i)).toBeVisible()
    await expect(args.onJoin).not.toHaveBeenCalled()
  },
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const sampleNotifications: HubNotification[] = [
  { id: 'n2', type: 'vpn' },
  { id: 'n3', type: 'monitorsPermission' },
  { id: 'n4', type: 'joinApproved', server: { id: 's2', name: 'Clan Zero' }, createdAt: minutesAgo(12) },
  { id: 'n5', type: 'kicked', server: { name: 'Sexta Feira' }, createdAt: minutesAgo(60 * 26) },
  { id: 'n6', type: 'inviteExpired', server: { name: 'Turbex' }, createdAt: minutesAgo(3) },
]

/** Painel com estado próprio, para dispensar e limpar de verdade na story. */
function StoryNotifications({ initial }: { initial: HubNotification[] }) {
  const [items, setItems] = useState(initial)
  return (
    <NotificationsPanelView
      notifications={items}
      onDismiss={(id) => setItems((current) => current.filter((item) => item.id !== id))}
      onClearAll={() => setItems([])}
      onAllowMonitors={fn()}
      onOpenServer={fn()}
    />
  )
}

/** Telas grandes: notificações à esquerda, conteúdo centralizado. */
export const WithNotifications: Story = {
  args: { notifications: <StoryNotifications initial={sampleNotifications} /> },
}

export const ClearNotifications: Story = {
  args: { notifications: <StoryNotifications initial={sampleNotifications} /> },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /dismiss: looks like you're using a vpn/i }))
    await expect(canvas.queryByText(/vpn or proxy/i)).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /clear all/i }))
    await expect(canvas.getByText(/all caught up/i)).toBeVisible()
  },
}

export const NotificationsEmpty: Story = { args: { notifications: <StoryNotifications initial={[]} /> } }

/** Aviso do admin da plataforma: título e mensagem vêm prontos, quebras de linha mantidas. */
export const PlatformAnnouncement: Story = {
  args: {
    notifications: (
      <StoryNotifications
        initial={[
          {
            id: 'a1',
            type: 'platformAnnouncement',
            announcement: {
              title: 'Transmissões via servidor desativadas',
              message: 'Estamos ajustando o servidor de mídia.\nUse o modo Direto (Mesh) até voltar.',
            },
            createdAt: minutesAgo(2),
          },
          ...sampleNotifications.slice(3),
        ]}
      />
    ),
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Transmissões via servidor desativadas')).toBeVisible()
    await expect(canvas.getByText(/use o modo direto/i)).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /dismiss: transmissões via servidor/i }))
    await expect(canvas.queryByText('Transmissões via servidor desativadas')).not.toBeInTheDocument()
  },
}

/** Sair pede confirmação: cancelar não chama o ViewModel, confirmar chama. */
export const SignOut: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /sign out/i }))
    await userEvent.click(await screen.findByRole('button', { name: /cancel/i }))
    await expect(args.onSignOut).not.toHaveBeenCalled()

    await userEvent.click(await canvas.findByRole('button', { name: /sign out/i }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /sign out/i }))
    await expect(args.onSignOut).toHaveBeenCalledOnce()
  },
}

export const SigningOut: Story = { args: { isSigningOut: true } }

export const Portuguese: Story = { globals: { locale: 'pt' }, args: { isPlatformAdmin: true } }
