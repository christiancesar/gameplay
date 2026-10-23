import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'

import { me, servers } from '@/fixtures'
import { languageOptions, useStoryLanguage } from '@/fixtures/language'
import { useStoryTheme } from '@/fixtures/theme'

import { BrowserSupportAlertView } from '@/modules/browser-support/views/browser-support-alert.view'
import { HardwarePermissionBannerView } from '@/modules/hardware/views/hardware-permission-banner.view'

import { HubView } from './hub.view'

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
    joinCode: '',
    isJoining: false,
    theme: 'dark',
    language: 'en',
    languageOptions,
    onOpenServer: fn(),
    onCreateServer: fn(),
    onJoinCodeChange: fn(),
    onJoin: fn(),
    onOpenAdmin: fn(),
    onOpenSettings: fn(),
    onToggleTheme: fn(),
    onLanguageChange: fn(),
  },
  render: function Render(args) {
    const [joinCode, setJoinCode] = useState(args.joinCode)
    const language = useStoryLanguage()
    const theme = useStoryTheme()
    return (
      <HubView
        {...args}
        {...language}
        {...theme}
        joinCode={joinCode}
        onJoinCodeChange={(value) => {
          args.onJoinCodeChange(value)
          setJoinCode(value)
        }}
      />
    )
  },
} satisfies Meta<typeof HubView>

export default meta
type Story = StoryObj<typeof meta>

/** Igual ao mock home-logado.png. */
export const Default: Story = { args: { joinCode: 'JH34SD32' } }

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

export const Joining: Story = { args: { joinCode: 'JH34SD32', isJoining: true } }

export const JoinInviteExpired: Story = { args: { joinCode: 'JH34SD32', joinError: 'inviteExpired' } }

export const JoinServerFull: Story = { args: { joinCode: 'JH34SD32', joinError: 'serverFull' } }

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
    await expect(args.onJoin).toHaveBeenCalledOnce()
  },
}

/** Primeira visita: pede a permissão de ver os monitores. */
export const HardwarePermission: Story = {
  args: { banner: <HardwarePermissionBannerView onAllow={fn()} onDismiss={fn()} /> },
}

/** Chromium desatualizado. */
export const OutdatedBrowser: Story = {
  args: {
    banner: <BrowserSupportAlertView status={{ type: 'outdated', browser: { name: 'Chrome', version: '109' }, minVersion: 130 }} onDismiss={fn()} />,
  },
}

export const Portuguese: Story = { globals: { locale: 'pt' }, args: { isPlatformAdmin: true } }
