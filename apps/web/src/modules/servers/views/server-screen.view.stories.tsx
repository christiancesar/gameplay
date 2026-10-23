import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps } from 'react'
import { fn } from 'storybook/test'

import { images, me } from '@/fixtures'
import { liveStats, roomsWithMe, roomsWithoutMe, stage, stageWithLive, turbex } from '@/fixtures/server'
import { RoomStageView } from '@/modules/rooms/views/room-stage.view'
import { SharePanelView, type SharePanelState } from '@/modules/screen-share/views/share-panel.view'
import { StreamViewerView } from '@/modules/screen-share/views/stream-viewer.view'

import { ServerScreenView } from './server-screen.view'
import { ServerSidebarView, type SidebarRoom } from './server-sidebar.view'
import { UserCardView, type ServerRole } from './user-card.view'

type ScenarioProps = {
  role: ServerRole
  pendingRequests: number
  rooms: SidebarRoom[]
  currentRoomId?: string
  share: SharePanelState
  isMuted: boolean
  main: 'logo' | 'room' | 'roomWithLive' | 'micDenied' | 'watching'
}

/** Monta a tela inteira a partir de um cenário, do jeito que a Screen fará com os ViewModels. */
function Scenario({ role, pendingRequests, rooms, currentRoomId, share, isMuted, main }: ScenarioProps) {
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
    <ServerScreenView
      sidebar={
        <ServerSidebarView
          server={turbex}
          rooms={rooms}
          currentRoomId={currentRoomId}
          onSelectRoom={fn()}
          onBackToHub={fn()}
          userCard={
            <UserCardView
              user={me}
              serverName={turbex.name}
              role={role}
              pendingRequests={pendingRequests}
              inRoom={inRoom}
              isMuted={isMuted}
              isDeafened={false}
              sharePanel={
                <SharePanelView
                  state={share}
                  onStart={fn()}
                  onPresetChange={fn()}
                  onIncludeAudioChange={fn()}
                  onConfirm={fn()}
                  onCancel={fn()}
                  onStop={fn()}
                />
              }
              onOpenServerSettings={fn()}
              onLeaveServer={fn()}
              onToggleMute={fn()}
              onToggleDeafen={fn()}
              onLeaveRoom={fn()}
            />
          }
        />
      }
      main={mainContent}
    />
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

export const OwnerWithPendingRequests: Story = { args: { pendingRequests: 2 } }

export const MemberOutsideRoom: Story = { args: { role: 'member' } }

/** Dentro da Room 01, como no mock servidor-screen.png. */
export const InRoom: Story = { args: { rooms: roomsWithMe, currentRoomId: 'r1', main: 'room' } }

export const InRoomMuted: Story = { args: { ...InRoom.args, isMuted: true } }

export const MicrophoneDenied: Story = { args: { ...InRoom.args, isMuted: true, main: 'micDenied' } }

export const ChoosingShareQuality: Story = {
  args: { ...InRoom.args, share: { status: 'configuring', preset: '1080p60', includeAudio: true } },
}

export const Sharing: Story = {
  args: {
    ...InRoom.args,
    rooms: roomsWithMe.map((room) =>
      room.id === 'r1'
        ? { ...room, participants: room.participants.map((p) => (p.id === me.id ? { ...p, isLive: true } : p)) }
        : room,
    ),
    share: { status: 'live', preset: '1080p60', stats: liveStats, viewers: 2, degraded: false },
  },
}

export const SharingDegraded: Story = {
  args: {
    ...Sharing.args,
    share: { status: 'live', preset: '1080p60', stats: { ...liveStats, uploadKbps: 2100, fps: 24 }, viewers: 4, degraded: true },
  },
}

export const OthersLive: Story = { args: { ...InRoom.args, main: 'roomWithLive' } }

export const WatchingStream: Story = { args: { ...InRoom.args, main: 'watching' } }
