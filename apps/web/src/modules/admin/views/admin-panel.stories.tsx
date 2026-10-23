import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor, within } from 'storybook/test'

import { adminServerMembers, adminServers, adminSessions, adminUsers, registrationKeys } from '@/fixtures/admin'

import { AdminLayoutView, type AdminTab } from './admin-layout.view'
import { KeysTabView } from './keys-tab.view'
import { LimitDialogView } from './limit-dialog.view'
import { LimitsTabView } from './limits-tab.view'
import { ResetPasswordDialogView } from './reset-password-dialog.view'
import { ServerMembersDialogView } from './server-members-dialog.view'
import { ServersTabView } from './servers-tab.view'
import { SessionsDialogView } from './sessions-dialog.view'
import { UsersTabView } from './users-tab.view'

type Overlay = 'none' | 'sessions' | 'resetPassword' | 'userLimit' | 'serverLimits' | 'serverMembers' | 'newKey'

type ScenarioProps = { initialTab: AdminTab; overlay: Overlay; empty: boolean }

const actions = { onSuspend: fn(), onEndSessions: fn(), onDeleteServer: fn(), onGenerateKey: fn(), onTabChange: fn() }

function Scenario({ initialTab, overlay, empty }: ScenarioProps) {
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const users = empty ? [] : adminUsers.filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))

  const content = {
    users: (
      <UsersTabView
        users={users}
        search={search}
        onSearchChange={setSearch}
        onViewSessions={fn()}
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
    limits: (
      <LimitsTabView values={{ serversPerUser: 1, membersPerServer: 10, roomsPerServer: 2 }} isDirty={false} isSaving={false} onChange={fn()} onSave={fn()} />
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
      <ServerMembersDialogView open={overlay === 'serverMembers'} serverName="Turbex" members={adminServerMembers} onOpenChange={fn()} />
      <SessionsDialogView open={overlay === 'sessions'} userName="Lua Nova" sessions={adminSessions} onOpenChange={fn()} onEndSession={fn()} />
      <ResetPasswordDialogView
        open={overlay === 'resetPassword'}
        userName="Jacutinga"
        password="vX9-tq2M-pL7w"
        isSubmitting={false}
        onOpenChange={fn()}
        onPasswordChange={fn()}
        onGenerate={fn()}
        onCopy={fn()}
        onSubmit={fn()}
      />
      <LimitDialogView
        open={overlay === 'userLimit'}
        title="Kisnaider"
        fields={[{ id: 'servers', label: 'Servers per user', defaultValue: 1, override: 3 }]}
        isSaving={false}
        onOpenChange={fn()}
        onOverrideChange={fn()}
        onSave={fn()}
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
        onOverrideChange={fn()}
        onSave={fn()}
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
    initialTab: { control: 'inline-radio', options: ['users', 'servers', 'limits', 'keys'] },
    overlay: { control: 'select', options: ['none', 'sessions', 'resetPassword', 'userLimit', 'serverLimits', 'serverMembers', 'newKey'] },
  },
} satisfies Meta<typeof Scenario>

export default meta
type Story = StoryObj<typeof meta>

export const Users: Story = {}
export const UsersEmpty: Story = { args: { empty: true } }
export const UserSessions: Story = { args: { overlay: 'sessions' } }
export const ResetPassword: Story = { args: { overlay: 'resetPassword' } }
export const UserServerLimit: Story = { args: { overlay: 'userLimit' } }

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

export const SignUpKeys: Story = { args: { initialTab: 'keys' } }
export const NewSignUpKey: Story = { args: { initialTab: 'keys', overlay: 'newKey' } }
