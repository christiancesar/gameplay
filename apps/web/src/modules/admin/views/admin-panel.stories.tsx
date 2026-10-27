import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor, within } from 'storybook/test'

import {
  adminDevices,
  adminServerMembers,
  adminServers,
  adminSessions,
  adminUsers,
  registrationKeys,
  hardwareSummary,
} from '@/fixtures/admin'

import { AdminLayoutView, type AdminTab } from './admin-layout.view'
import { AnnouncementsTabView } from './announcements-tab.view'
import { DeviceHardwareDialogView } from './device-hardware-dialog.view'
import { HardwareTabView } from './hardware-tab.view'
import { KeysTabView } from './keys-tab.view'
import { LimitDialogView } from './limit-dialog.view'
import { LimitsTabView } from './limits-tab.view'
import { MediaOffConfirmDialogView } from './media-off-confirm-dialog.view'
import { MediaTabView } from './media-tab.view'
import { ResetPasswordDialogView } from './reset-password-dialog.view'
import { ServerMembersDialogView } from './server-members-dialog.view'
import { ServersTabView } from './servers-tab.view'
import { SessionsDialogView } from './sessions-dialog.view'
import { UsersTabView } from './users-tab.view'

type Overlay =
  | 'none'
  | 'sessions'
  | 'resetPassword'
  | 'userLimit'
  | 'serverLimits'
  | 'serverMembers'
  | 'userHardware'
  | 'newKey'
  | 'mediaOff'

type ScenarioProps = { initialTab: AdminTab; overlay: Overlay; empty: boolean }

const actions = {
  onOpenDevice: fn(),
  onSuspend: fn(),
  onEndSessions: fn(),
  onDeleteServer: fn(),
  onGenerateKey: fn(),
  onTabChange: fn(),
  onSaveLimits: fn(),
  onResetPassword: fn(),
  onSaveOverrides: fn(),
  onSendAnnouncement: fn(),
  onToggleMedia: fn(),
  onAdjustServer: fn(),
  onConfirmMediaOff: fn(),
}

const mediaData = {
  settings: { sfu: true, mesh: true, turn: true },
  providers: {
    sfu: { name: 'cloudflare', state: 'ready' as const },
    turn: { name: 'cloudflare', state: 'failing' as const },
  },
  exceptions: [{ serverId: 's2', serverName: 'Clan Zero', overrides: { sfu: false, mesh: null, turn: true } }],
}

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
      <LimitsTabView
        values={{ serversPerUser: 1, membersPerServer: 10, roomsPerServer: 2, minChromiumVersion: 130 }}
        isSaving={false}
        onSave={actions.onSaveLimits}
      />
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
    media: (
      <MediaTabView
        data={empty ? { ...mediaData, exceptions: [] } : mediaData}
        isSaving={false}
        onToggle={actions.onToggleMedia}
        onAdjustServer={actions.onAdjustServer}
      />
    ),
    announcements: (
      <AnnouncementsTabView
        servers={empty ? [] : adminServers.map(({ id, name }) => ({ id, name }))}
        isSending={false}
        onSend={actions.onSendAnnouncement}
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
        devices={
          deviceId ? adminDevices.filter((d) => d.id === deviceId) : adminDevices.filter((d) => d.user.id === 'u1')
        }
        currentDeviceId={deviceId}
        onDeviceChange={setDeviceId}
        onOpenChange={(open) => !open && setDeviceId(undefined)}
      />
      <ServerMembersDialogView
        open={overlay === 'serverMembers'}
        serverName="Turbex"
        members={adminServerMembers}
        onOpenChange={fn()}
      />
      <SessionsDialogView
        open={overlay === 'sessions'}
        userName="LuaNova"
        sessions={adminSessions}
        onOpenChange={fn()}
        onEndSession={fn()}
      />
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
        media={{ globals: mediaData.settings, choices: { sfu: 'off', mesh: 'global', turn: 'global' } }}
        isSaving={false}
        onOpenChange={fn()}
        onSave={actions.onSaveOverrides}
      />
      <MediaOffConfirmDialogView
        open={overlay === 'mediaOff'}
        resources={['sfu']}
        scope="server"
        impact={3}
        isSaving={false}
        onConfirm={actions.onConfirmMediaOff}
        onCancel={fn()}
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
    initialTab: {
      control: 'inline-radio',
      options: ['users', 'servers', 'hardware', 'limits', 'media', 'keys', 'announcements'],
    },
    overlay: {
      control: 'select',
      options: [
        'none',
        'sessions',
        'resetPassword',
        'userLimit',
        'serverLimits',
        'serverMembers',
        'userHardware',
        'newKey',
        'mediaOff',
      ],
    },
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
    await expect(actions.onSaveOverrides).toHaveBeenCalledWith(
      { members: 25, rooms: undefined },
      { sfu: 'off', mesh: 'global', turn: 'global' },
    )
  },
}

/** O global aparece no campo, travado; desmarcar "Use the global default" libera o número do servidor. */
export const ServerLimitsOwnValue: Story = {
  args: { initialTab: 'servers', overlay: 'serverLimits' },
  play: async ({ userEvent }) => {
    const rooms = await screen.findByLabelText(/^rooms per server$/i)
    await expect(rooms).toBeDisabled()
    await expect(rooms).toHaveValue(2)
    await userEvent.click(screen.getByRole('checkbox', { name: /use the global default \(2\)/i }))
    const editable = screen.getByLabelText(/^rooms per server$/i)
    await expect(editable).toBeEnabled()
    await userEvent.clear(editable)
    await userEvent.type(editable, '5')
    await userEvent.click(screen.getByRole('combobox', { name: /server \(sfu\)/i }))
    await userEvent.click(await screen.findByRole('option', { name: /global default \(on\)/i }))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await expect(actions.onSaveOverrides).toHaveBeenCalledWith(
      { members: 20, rooms: 5 },
      { sfu: 'global', mesh: 'global', turn: 'global' },
    )
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
    await expect(actions.onSaveLimits).toHaveBeenCalledWith(
      { serversPerUser: 1, membersPerServer: 10, roomsPerServer: 3, minChromiumVersion: 130 },
      expect.anything(),
    )
  },
}

export const SignUpKeys: Story = { args: { initialTab: 'keys' } }
export const NewSignUpKey: Story = { args: { initialTab: 'keys', overlay: 'newKey' } }

export const Announcements: Story = { args: { initialTab: 'announcements' } }

/** Sem título e sem servidor escolhido não envia; com tudo preenchido, entrega os valores ao ViewModel. */
export const SendAnnouncement: Story = {
  args: { initialTab: 'announcements' },
  play: async ({ canvas, userEvent }) => {
    const send = canvas.getByRole('button', { name: /send announcement/i })
    await userEvent.click(send)
    await expect(await canvas.findAllByText(/fill this in/i)).toHaveLength(2)

    await userEvent.type(canvas.getByLabelText(/title/i), 'Maintenance at 10 pm')
    await userEvent.type(canvas.getByLabelText(/message/i), 'The app will be down for about 10 minutes.')
    await userEvent.click(canvas.getByRole('combobox', { name: /send to/i }))
    await userEvent.click(await screen.findByRole('option', { name: /members of a server/i }))
    await userEvent.click(send)
    await expect(await canvas.findByText(/pick a server\./i)).toBeVisible()
    await expect(actions.onSendAnnouncement).not.toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('combobox', { name: /^server$/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'Turbex' }))
    await userEvent.click(send)
    await waitFor(() =>
      expect(actions.onSendAnnouncement).toHaveBeenCalledWith(
        {
          title: 'Maintenance at 10 pm',
          message: 'The app will be down for about 10 minutes.',
          audience: 'server',
          serverId: expect.any(String),
        },
        expect.anything(),
      ),
    )
  },
}

export const Media: Story = { args: { initialTab: 'media' } }
export const MediaNoExceptions: Story = { args: { initialTab: 'media', empty: true } }

/** Desligar um recurso passa pelo ViewModel; a exceção abre o "Ajustar servidor". */
export const MediaToggle: Story = {
  args: { initialTab: 'media' },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('switch', { name: /relay \(turn\)/i }))
    await expect(actions.onToggleMedia).toHaveBeenCalledWith('turn', false)
    await userEvent.click(canvas.getByRole('button', { name: /adjust/i }))
    await expect(actions.onAdjustServer).toHaveBeenCalledWith('s2')
  },
}

/** Confirmação: avisar manda o texto sugerido (editável); desligar sem avisar não manda nada. */
export const MediaOffConfirm: Story = {
  args: { initialTab: 'servers', overlay: 'mediaOff' },
  play: async ({ userEvent }) => {
    await waitFor(() => expect(screen.getByText(/3 people in voice rooms/i)).toBeVisible())
    await userEvent.click(screen.getByRole('button', { name: /turn off without notifying/i }))
    await expect(actions.onConfirmMediaOff).toHaveBeenLastCalledWith()

    const title = screen.getByLabelText(/notice title/i)
    await userEvent.clear(title)
    await userEvent.type(title, 'SFU down')
    await userEvent.click(screen.getByRole('button', { name: /turn off and notify/i }))
    await waitFor(() =>
      expect(actions.onConfirmMediaOff).toHaveBeenLastCalledWith({
        title: 'SFU down',
        message: 'The platform admin turned off Server (SFU) for now.',
        audience: 'affected',
      }),
    )
  },
}
