import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentProps } from 'react'
import { expect, fn } from 'storybook/test'

import { images, me } from '@/fixtures'
import {
  liveLimitedByNetwork,
  liveOnTarget,
  myServers,
  presenceMembers,
  roomsWithMe,
  roomsWithoutMe,
  stage,
  stageWithLive,
  turbex,
  viewerQualities,
} from '@/fixtures/server'
import { RoomStageView } from '@/modules/rooms/views/room-stage.view'
import { ShareDetailsDialogView } from '@/modules/screen-share/views/share-details-dialog.view'
import { SharePanelView, type SharePanelState } from '@/modules/screen-share/views/share-panel.view'
import { ShareSetupDialogView } from '@/modules/screen-share/views/share-setup-dialog.view'
import { StreamViewerView } from '@/modules/screen-share/views/stream-viewer.view'

import { ServerScreenView } from './server-screen.view'
import { MembersPresenceView } from './members-presence.view'
import { ServerSidebarView, type ServerRole } from './server-sidebar.view'
import type { SidebarRoom } from '@/modules/servers/model/entities/sidebar-room'
import { UserCardView } from './user-card.view'

type ScenarioProps = {
  role: ServerRole
  pendingRequests: number
  rooms: SidebarRoom[]
  currentRoomId?: string
  share: SharePanelState
  isMuted: boolean
  main: 'logo' | 'room' | 'roomWithLive' | 'micDenied' | 'watching'
  overlay?: 'shareSetup' | 'shareDetails'
  sidebarCollapsed?: boolean
}

/** Monta a tela inteira a partir de um cenário, do jeito que a Screen fará com os ViewModels. */
function Scenario({
  role,
  pendingRequests,
  rooms,
  currentRoomId,
  share,
  isMuted,
  main,
  overlay,
  sidebarCollapsed,
}: ScenarioProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(!sidebarCollapsed)
  const inRoom = Boolean(currentRoomId)
  const stageProps: Omit<ComponentProps<typeof RoomStageView>, 'participants' | 'micDenied'> = {
    roomName: 'Room 01',
    onWatch: fn(),
    onVolumeChange: fn(),
  }

  const mainContent = {
    logo: undefined,
    room: <RoomStageView {...stageProps} participants={stage} micDenied={false} />,
    roomWithLive: <RoomStageView {...stageProps} participants={stageWithLive} micDenied={false} />,
    micDenied: <RoomStageView {...stageProps} participants={stage} micDenied />,
    watching: (
      <StreamViewerView
        streamerName="Kisnaider"
        video={<img src={images.streamFrame} alt="" className="max-h-full max-w-full object-contain" />}
        liveStreams={[
          { id: 'u3', name: 'Kisnaider' },
          { id: 'u4', name: 'Marreta' },
        ]}
        currentStreamId="u3"
        streamVolume={80}
        participants={stageWithLive}
        onSwitchStream={fn()}
        onStopWatching={fn()}
        onFullscreen={fn()}
        onStreamVolumeChange={fn()}
        onWatch={fn()}
        onVolumeChange={fn()}
      />
    ),
  }[main]

  return (
    <>
      <ShareSetupDialogView
        open={overlay === 'shareSetup'}
        settings={{ source: 'window', resolution: '1080p', fps: 60, includeAudio: false }}
        priority="smooth"
        audioSupport="unsupported"
        saveAsDefault
        onOpenChange={fn()}
        onChange={fn()}
        onPriorityChange={fn()}
        onSaveAsDefaultChange={fn()}
        onStart={fn()}
      />
      <ShareDetailsDialogView
        open={overlay === 'shareDetails'}
        target={{ resolution: '1080p', fps: 60 }}
        viewers={viewerQualities}
        onOpenChange={fn()}
      />
      <ServerScreenView
        sidebar={
          <ServerSidebarView
            server={turbex}
            servers={myServers}
            currentServerId={turbex.id}
            onSelectServer={fn()}
            onConfirmSwitch={fn()}
            onDismissSwitch={fn()}
            role={role}
            pendingRequests={pendingRequests}
            rooms={rooms}
            currentRoomId={currentRoomId}
            onSelectRoom={fn()}
            onBackToHub={fn()}
            onOpenServerSettings={fn()}
            onLeaveServer={fn()}
            members={<MembersPresenceView members={presenceMembers} />}
            userCard={
              <UserCardView
                user={me}
                inRoom={inRoom}
                isMuted={isMuted}
                isDeafened={false}
                sharePanel={<SharePanelView state={share} onStart={fn()} onStop={fn()} onOpenDetails={fn()} />}
                onOpenSettings={fn()}
                onToggleMute={fn()}
                onToggleDeafen={fn()}
                onLeaveRoom={fn()}
              />
            }
          />
        }
        main={mainContent}
        isSidebarOpen={isSidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
      />
    </>
  )
}

const meta = {
  title: 'Servers/ServerScreen',
  component: Scenario,
  parameters: { layout: 'fullscreen' },
  args: {
    role: 'owner',
    pendingRequests: 0,
    rooms: roomsWithoutMe,
    currentRoomId: undefined,
    share: { status: 'idle' },
    isMuted: false,
    main: 'logo',
  },
} satisfies Meta<typeof Scenario>

export default meta
type Story = StoryObj<typeof meta>

/** Fora de sala: área principal com o logo. */
export const OutsideRoom: Story = {}

/** Celular: a sidebar vira um painel fechado e a barra do topo abre ela. */
export const Mobile: Story = {
  args: { rooms: roomsWithMe, currentRoomId: 'r1', main: 'room' },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
}

export const OwnerWithPendingRequests: Story = { args: { pendingRequests: 2 } }

export const MemberOutsideRoom: Story = { args: { role: 'member' } }

export const MemberInRoom: Story = { args: { role: 'member', rooms: roomsWithMe, currentRoomId: 'r1', main: 'room' } }

/** Dentro da Room 01, como no mock servidor-screen.png. */
export const InRoom: Story = { args: { rooms: roomsWithMe, currentRoomId: 'r1', main: 'room' } }

export const InRoomMuted: Story = { args: { ...InRoom.args, isMuted: true } }

export const MicrophoneDenied: Story = { args: { ...InRoom.args, isMuted: true, main: 'micDenied' } }

/** Clicou no botão verde: modal para escolher fonte e qualidade. */
export const ShareSetup: Story = { args: { ...InRoom.args, overlay: 'shareSetup' } }

export const WaitingBrowserPicker: Story = { args: { ...InRoom.args, share: { status: 'picking' } } }

export const Sharing: Story = {
  args: {
    ...InRoom.args,
    rooms: roomsWithMe.map((room) =>
      room.id === 'r1'
        ? { ...room, participants: room.participants.map((p) => (p.id === me.id ? { ...p, isLive: true } : p)) }
        : room,
    ),
    share: liveOnTarget,
  },
}

export const SharingDegraded: Story = {
  args: {
    ...Sharing.args,
    share: liveLimitedByNetwork,
  },
}

export const SharingDetails: Story = { args: { ...SharingDegraded.args, overlay: 'shareDetails' } }

export const OthersLive: Story = { args: { ...InRoom.args, main: 'roomWithLive' } }

export const WatchingStream: Story = { args: { ...InRoom.args, main: 'watching' } }

/** Sidebar recolhida em ícones para dar mais espaço à transmissão. */
export const WatchingWithSidebarCollapsed: Story = { args: { ...WatchingStream.args, sidebarCollapsed: true } }

/** O botão ao lado do logo recolhe e expande a sidebar (atalho: Ctrl/Cmd + B). */
export const ToggleSidebar: Story = {
  args: { ...InRoom.args },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const sidebar = canvasElement.querySelector('[data-slot="sidebar"]')
    const toggle = () => canvas.getAllByRole('button', { name: /expand or collapse sidebar/i })[0]
    await expect(sidebar).toHaveAttribute('data-state', 'expanded')
    await userEvent.click(toggle())
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed')
    await userEvent.click(toggle())
    await expect(sidebar).toHaveAttribute('data-state', 'expanded')
  },
}
