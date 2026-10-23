import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor, within } from 'storybook/test'

import { images } from '@/fixtures'
import { fullMembers, invites, members, requests, settingsRooms } from '@/fixtures/server-settings'

import { DangerSectionView } from './danger-section.view'
import { GeneralSectionView } from './general-section.view'
import { InvitesSectionView } from './invites-section.view'
import { MembersSectionView } from './members-section.view'
import { RequestsSectionView } from './requests-section.view'
import { RoomsSectionView } from './rooms-section.view'
import { ServerSettingsDialogView, type ServerSettingsSection } from './server-settings-dialog.view'

type ScenarioProps = {
  initialSection: ServerSettingsSection
  role: 'owner' | 'admin'
  full: boolean
  roomLimitReached: boolean
  empty: boolean
  generalErrors: boolean
  autoApprove: boolean
}

const actions = {
  onAutoApproveChange: fn(),
  onSectionChange: fn(),
  onPromote: fn(),
  onDemote: fn(),
  onKick: fn(),
  onApprove: fn(),
  onDecline: fn(),
  onGenerate: fn(),
  onCopy: fn(),
  onRevoke: fn(),
  onCreateRoom: fn(),
  onDeleteRoom: fn(),
  onLeave: fn(),
  onDeleteServer: fn(),
  onSave: fn(),
}

/** Modal completo com navegação entre seções; os dados vêm das fixtures. */
function Scenario({ initialSection, role, full, roomLimitReached, empty, generalErrors, autoApprove: initialAutoApprove }: ScenarioProps) {
  const [autoApprove, setAutoApprove] = useState(initialAutoApprove)
  const [section, setSection] = useState(initialSection)
  const memberList = full ? fullMembers : members
  const requestList = empty ? [] : requests
  const roomList = roomLimitReached ? settingsRooms : settingsRooms.slice(0, 1)

  const content = {
    general: (
      <GeneralSectionView
        values={{ name: 'Turbex', description: 'Dota toda sexta à noite.' }}
        iconUrl={images.serverTurbex}
        coverUrl={generalErrors ? undefined : images.streamFrame}
        nameError={generalErrors ? 'nameRequired' : undefined}
        coverError={generalErrors ? 'tooLarge' : undefined}
        uploading={{ icon: false, cover: false }}
        isDirty
        isSaving={false}
        onChange={fn()}
        onSelectIcon={fn()}
        onRemoveIcon={fn()}
        onSelectCover={fn()}
        onRemoveCover={fn()}
        onSave={actions.onSave}
      />
    ),
    invites: (
      <InvitesSectionView
        autoApprove={autoApprove}
        onAutoApproveChange={(value) => {
          actions.onAutoApproveChange(value)
          setAutoApprove(value)
        }}
        invites={empty ? [] : invites}
        maxUses={5}
        duration="7d"
        isGenerating={false}
        memberCount={memberList.length}
        memberLimit={10}
        copiedCode={empty ? undefined : 'JH34SD32'}
        onMaxUsesChange={fn()}
        onDurationChange={fn()}
        onGenerate={actions.onGenerate}
        onCopy={actions.onCopy}
        onRevoke={actions.onRevoke}
      />
    ),
    requests: (
      <RequestsSectionView
        autoApprove={autoApprove}
        requests={requestList}
        memberCount={memberList.length}
        memberLimit={10}
        onApprove={actions.onApprove}
        onDecline={actions.onDecline}
      />
    ),
    members: (
      <MembersSectionView
        members={role === 'admin' ? memberList.map((m) => ({ ...m, isMe: m.id === 'm2' })) : memberList}
        memberLimit={10}
        onPromote={actions.onPromote}
        onDemote={actions.onDemote}
        onKick={actions.onKick}
      />
    ),
    rooms: (
      <RoomsSectionView
        rooms={roomList}
        roomLimit={2}
        newRoomName=""
        isCreating={false}
        onNewRoomNameChange={fn()}
        onCreate={actions.onCreateRoom}
        onStartRename={fn()}
        onRenameChange={fn()}
        onRenameSave={fn()}
        onRenameCancel={fn()}
        onDelete={actions.onDeleteRoom}
      />
    ),
    danger: <DangerSectionView role={role} serverName="Turbex" isBusy={false} onLeave={actions.onLeave} onDelete={actions.onDeleteServer} />,
  }[section]

  return (
    <ServerSettingsDialogView
      open
      serverName="Turbex"
      section={section}
      pendingRequests={requestList.length}
      onOpenChange={fn()}
      onSectionChange={(next) => {
        actions.onSectionChange(next)
        setSection(next)
      }}
    >
      {content}
    </ServerSettingsDialogView>
  )
}

const meta = {
  title: 'Servers/ServerSettings',
  component: Scenario,
  args: { initialSection: 'general', role: 'owner', full: false, roomLimitReached: false, empty: false, generalErrors: false, autoApprove: false },
  argTypes: {
    initialSection: { control: 'select', options: ['general', 'invites', 'requests', 'members', 'rooms', 'danger'] },
    role: { control: 'inline-radio', options: ['owner', 'admin'] },
  },
} satisfies Meta<typeof Scenario>

export default meta
type Story = StoryObj<typeof meta>

export const General: Story = {}
export const GeneralWithErrors: Story = { args: { generalErrors: true } }

export const Invites: Story = { args: { initialSection: 'invites' } }
export const InvitesAutoApproveOn: Story = { args: { initialSection: 'invites', autoApprove: true } }

export const ToggleAutoApprove: Story = {
  args: { initialSection: 'invites' },
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getByRole('switch', { name: /approve new members automatically/i }))
    await expect(actions.onAutoApproveChange).toHaveBeenCalledWith(true)
    await expect(screen.getByRole('switch', { name: /approve new members automatically/i })).toBeChecked()
  },
}

export const InvitesEmpty: Story = { args: { initialSection: 'invites', empty: true } }
export const InvitesBlockedServerFull: Story = {
  args: { initialSection: 'invites', full: true },
  play: async () => {
    await expect(screen.getByRole('button', { name: /generate invite/i })).toBeDisabled()
  },
}

export const Requests: Story = {
  args: { initialSection: 'requests' },
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getAllByRole('button', { name: /approve/i })[0])
    await expect(actions.onApprove).toHaveBeenCalledWith('j1')
  },
}
export const RequestsWithAutoApprove: Story = { args: { initialSection: 'requests', autoApprove: true, full: true } }
export const RequestsEmpty: Story = { args: { initialSection: 'requests', empty: true } }
export const RequestsBlockedServerFull: Story = {
  args: { initialSection: 'requests', full: true },
  play: async () => {
    for (const button of screen.getAllByRole('button', { name: /approve/i })) await expect(button).toBeDisabled()
  },
}

export const Members: Story = { args: { initialSection: 'members' } }
export const MembersAsAdmin: Story = { args: { initialSection: 'members', role: 'admin' } }
export const KickMember: Story = {
  args: { initialSection: 'members' },
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getByRole('button', { name: /actions: jacutinga/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /kick/i }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /^kick$/i }))
    await expect(actions.onKick).toHaveBeenCalledWith('m3')
  },
}

export const Rooms: Story = { args: { initialSection: 'rooms' } }
export const RoomsLimitReached: Story = { args: { initialSection: 'rooms', roomLimitReached: true } }

export const DangerOwner: Story = {
  args: { initialSection: 'danger' },
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getByRole('button', { name: /delete server/i }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: /delete server/i })
    await expect(confirm).toBeDisabled()
    await userEvent.type(within(dialog).getByLabelText(/type turbex/i), 'Turbex')
    await waitFor(() => expect(confirm).toBeEnabled())
  },
}
export const DangerAdmin: Story = { args: { initialSection: 'danger', role: 'admin' } }

export const NavigateSections: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(screen.getByRole('button', { name: /^requests/i }))
    await expect(actions.onSectionChange).toHaveBeenCalledWith('requests')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Requests' })).toBeVisible())
  },
}
