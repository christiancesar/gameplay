import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor, within } from 'storybook/test'

import { adminDevices, adminServerMembers, adminServers, adminSessions, adminUsers, registrationKeys, hardwareSummary } from '@/fixtures/admin'

import { AdminLayoutView, type AdminTab } from './admin-layout.view'
import { DeviceHardwareDialogView } from './device-hardware-dialog.view'
import { HardwareTabView } from './hardware-tab.view'
import { KeysTabView } from './keys-tab.view'
import { LimitDialogView } from './limit-dialog.view'
import { LimitsTabView } from './limits-tab.view'
import { ResetPasswordDialogView } from './reset-password-dialog.view'
import { ServerMembersDialogView } from './server-members-dialog.view'
import { ServersTabView } from './servers-tab.view'
import { SessionsDialogView } from './sessions-dialog.view'
import { UsersTabView } from './users-tab.view'

type Overlay = 'none' | 'sessions' | 'resetPassword' | 'userLimit' | 'serverLimits' | 'serverMembers' | 'userHardware' | 'newKey'

type ScenarioProps = { initialTab: AdminTab; overlay: Overlay; empty: boolean }

const actions = { onOpenDevice: fn(), onSuspend: fn(), onEndSessions: fn(), onDeleteServer: fn(), onGenerateKey: fn(), onTabChange: fn(), onSaveLimits: fn(), onResetPassword: fn(), onSaveOverrides: fn() }

function Scenario({ initialTab, overlay, empty }: ScenarioProps) {
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [deviceId, setDeviceId] = useState<string>()
  const users = empty ? [] : adminUsers.filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))

  const content = {
    users: (
      <UsersTabView
        users={users}
        search={search}
        onSearchChange={setSearch}
        onViewSessions={fn()}
        onViewHardware={fn()}
        onSuspend={actions.onSuspend}
        onReactivate={fn()}
        onEndSessions={actions.onEndSessions}
        onResetPassword={fn()}
        onEditLimit={fn()}
      />
    ),
    servers: (
      <ServersTabView
        servers={empty ? [] : adminServers}
        search=""
        onSearchChange={fn()}
        onViewMembers={fn()}
        onEditLimits={fn()}
        onDelete={actions.onDeleteServer}
      />
    ),
    hardware: (
      <HardwareTabView
        summary={empty ? { devices: 0, accelerationPercent: 0, h264HardwarePercent: 0 } : hardwareSummary}
        devices={empty ? [] : adminDevices}
        onOpenDevice={(id) => {
          actions.onOpenDevice(id)
          setDeviceId(id)
        }}
      />
    ),
    limits: (
      <LimitsTabView values={{ serversPerUser: 1, membersPerServer: 10, roomsPerServer: 2 }} isSaving={false} onSave={actions.onSaveLimits} />
    ),
    keys: (
      <KeysTabView
        keys={empty ? [] : registrationKeys}
        duration="7d"
        isGenerating={false}
        newKey={overlay === 'newKey' ? 'K7MX4P' : undefined}
        newKeyCopied={false}
        onDurationChange={fn()}
        onGenerate={actions.onGenerateKey}
        onCopyNewKey={fn()}
        onCloseNewKey={fn()}
        onRevoke={fn()}
      />
    ),
  }[tab]

  return (
    <>
      <AdminLayoutView
        tab={tab}
        onTabChange={(next) => {
          actions.onTabChange(next)
          setTab(next)
        }}
        onBackToHub={fn()}
      >
        {content}
      </AdminLayoutView>
      <DeviceHardwareDialogView
        open={overlay === 'userHardware' || Boolean(deviceId)}
        userName={deviceId ? (adminDevices.find((d) => d.id === deviceId)?.user.name ?? '') : 'Shinigame'}
        devices={deviceId ? adminDevices.filter((d) => d.id === deviceId) : adminDevices.filter((d) => d.user.id === 'u1')}
        currentDeviceId={deviceId}
        onDeviceChange={setDeviceId}
        onOpenChange={(open) => !open && setDeviceId(undefined)}
      />
      <ServerMembersDialogView open={overlay === 'serverMembers'} serverName="Turbex" members={adminServerMembers} onOpenChange={fn()} />
      <SessionsDialogView open={overlay === 'sessions'} userName="Lua Nova" sessions={adminSessions} onOpenChange={fn()} onEndSession={fn()} />
      <ResetPasswordDialogView
        open={overlay === 'resetPassword'}
        userName="Jacutinga"
        initialPassword="vX9-tq2M-pL7w"
        isSubmitting={false}
        onOpenChange={fn()}
        onGenerate={() => 'Qr4-nB8z-Ws2k'}
        onCopy={fn()}
        onSubmit={actions.onResetPassword}
      />
      <LimitDialogView
        open={overlay === 'userLimit'}
        title="Kisnaider"
        fields={[{ id: 'servers', label: 'Servers per user', defaultValue: 1, override: 3 }]}
        isSaving={false}
        onOpenChange={fn()}
        onSave={actions.onSaveOverrides}
      />
      <LimitDialogView
        open={overlay === 'serverLimits'}
        title="Clan Zero"
        fields={[
          { id: 'members', label: 'Members per server', defaultValue: 10, override: 20 },
          { id: 'rooms', label: 'Rooms per server', defaultValue: 2 },
        ]}
        isSaving={false}
        onOpenChange={fn()}
        onSave={actions.onSaveOverrides}
      />
    </>
  )
}

const meta = {
  title: 'Admin/AdminPanel',
  component: Scenario,
  parameters: { layout: 'fullscreen' },
  args: { initialTab: 'users', overlay: 'none', empty: false },
  argTypes: {
    initialTab: { control: 'inline-radio', options: ['users', 'servers', 'hardware', 'limits', 'keys'] },
    overlay: { control: 'select', options: ['none', 'sessions', 'resetPassword', 'userLimit', 'serverLimits', 'serverMembers', 'userHardware', 'newKey'] },
  },
} satisfies Meta<typeof Scenario>

export default meta
type Story = StoryObj<typeof meta>

export const Users: Story = {}
export const UsersEmpty: Story = { args: { empty: true } }
export const UserSessions: Story = { args: { overlay: 'sessions' } }
export const ResetPassword: Story = { args: { overlay: 'resetPassword' } }
export const UserServerLimit: Story = { args: { overlay: 'userLimit' } }

/** Validação do schema: senha curta não chega ao ViewModel; gerar preenche uma nova. */
export const ResetPasswordValidation: Story = {
  args: { overlay: 'resetPassword' },
  play: async ({ userEvent }) => {
    const input = await screen.findByLabelText(/new password/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'abc')
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
    await waitFor(() => expect(screen.getByText(/at least 8 characters/i)).toBeVisible())
    await expect(actions.onResetPassword).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /generate/i }))
    await expect(input).toHaveValue('Qr4-nB8z-Ws2k')
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }))
    await expect(actions.onResetPassword).toHaveBeenCalledWith({ password: 'Qr4-nB8z-Ws2k' }, expect.anything())
  },
}

export const ServerLimitsValidation: Story = {
  args: { initialTab: 'servers', overlay: 'serverLimits' },
  play: async ({ userEvent }) => {
    const members = await screen.findByLabelText(/^members per server$/i)
    await userEvent.clear(members)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(screen.getByText(/0 or more/i)).toBeVisible())
    await expect(actions.onSaveOverrides).not.toHaveBeenCalled()

    await userEvent.type(members, '25')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await expect(actions.onSaveOverrides).toHaveBeenCalledWith({ members: 25, rooms: undefined }, expect.anything())
  },
}

export const SuspendUser: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /actions: jacutinga/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /suspend/i }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /^suspend$/i }))
    await expect(actions.onSuspend).toHaveBeenCalledWith('u2')
  },
}

export const SearchUsers: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/search/i), 'kis')
    await waitFor(() => expect(canvas.queryByText('Jacutinga')).not.toBeInTheDocument())
    await expect(canvas.getByText('Kisnaider')).toBeVisible()
  },
}

export const UserHardware: Story = { args: { overlay: 'userHardware' } }

export const Hardware: Story = { args: { initialTab: 'hardware' } }
export const HardwareEmpty: Story = { args: { initialTab: 'hardware', empty: true } }
export const OpenDevice: Story = {
  args: { initialTab: 'hardware' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /windows 10 · edge 140/i }))
    await expect(actions.onOpenDevice).toHaveBeenCalledWith('d3')
    await waitFor(() => expect(screen.getByRole('dialog', { name: /hardware of jacutinga/i })).toBeVisible())
  },
}

export const Servers: Story = { args: { initialTab: 'servers' } }
export const ServerMembers: Story = { args: { initialTab: 'servers', overlay: 'serverMembers' } }
export const ServerLimits: Story = { args: { initialTab: 'servers', overlay: 'serverLimits' } }
export const DeleteServer: Story = {
  args: { initialTab: 'servers' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /actions: turbex/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /delete server/i }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.type(within(dialog).getByLabelText(/type turbex/i), 'Turbex')
    await userEvent.click(within(dialog).getByRole('button', { name: /delete server/i }))
    await expect(actions.onDeleteServer).toHaveBeenCalledWith('s1')
  },
}

export const GlobalLimits: Story = { args: { initialTab: 'limits' } }

export const GlobalLimitsValidation: Story = {
  args: { initialTab: 'limits' },
  play: async ({ canvas, userEvent }) => {
    const save = canvas.getByRole('button', { name: /^save$/i })
    await expect(save).toBeDisabled()
    const rooms = canvas.getByLabelText(/rooms per server/i)
    await userEvent.clear(rooms)
    await userEvent.type(rooms, '0')
    await userEvent.click(save)
    await expect(await canvas.findByText(/1 or more/i)).toBeVisible()
    await expect(actions.onSaveLimits).not.toHaveBeenCalled()

    await userEvent.clear(rooms)
    await userEvent.type(rooms, '3')
    await userEvent.click(save)
    await expect(actions.onSaveLimits).toHaveBeenCalledWith({ serversPerUser: 1, membersPerServer: 10, roomsPerServer: 3 }, expect.anything())
  },
}

export const SignUpKeys: Story = { args: { initialTab: 'keys' } }
export const NewSignUpKey: Story = { args: { initialTab: 'keys', overlay: 'newKey' } }
