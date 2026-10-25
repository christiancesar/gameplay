import type { SidebarRoom } from '@/modules/servers/model/entities/sidebar-room'
import type { ServerRole } from '@gameplay/contracts'
import { cn } from 'cn'
import { AudioLinesIcon, ChevronsUpDownIcon, LogOutIcon, RadioIcon, SettingsIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { ParticipantStatusView } from '@/modules/rooms/views/participant-status.view'
import { BrandLogo } from '@/shared/ui/brand-logo'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/ui/command'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { ServerIcon } from '@/shared/ui/server-icon'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/shared/ui/sidebar'
import { UserAvatar } from '@/shared/ui/user-avatar'

type ServerSidebarViewProps = {
  server: { name: string; iconUrl?: string }
  /** Servidores do usuário, para o seletor com busca. */
  servers: readonly { id: string; name: string; iconUrl?: string }[]
  currentServerId: string
  role: ServerRole
  pendingRequests: number
  rooms: readonly SidebarRoom[]
  currentRoomId?: string
  /** Card do usuário, renderizado no rodapé da sidebar. */
  userCard: ReactNode
  /** Membros online e offline, abaixo das salas (MembersPresenceView). */
  members?: ReactNode
  onSelectRoom: (roomId: string) => void
  /** Volta ao Hub sem desconectar da sala. */
  onBackToHub: () => void
  /** Escolheu outro servidor no seletor. O ViewModel decide se precisa confirmar (conectado numa sala). */
  onSelectServer: (serverId: string) => void
  /** Presente quando a troca de servidor vai desconectar o usuário da sala atual. */
  pendingSwitch?: { serverName: string; roomName: string }
  onConfirmSwitch: () => void
  /** Diálogo de troca fechou (cancelado ou depois de confirmar). */
  onDismissSwitch: () => void
  onOpenServerSettings: () => void
  onLeaveServer: () => void
}

/** Sidebar do servidor no padrão do shadcn; recolhe para ícones. Precisa de um SidebarProvider acima (ServerScreenView). */
function ServerSidebarView({
  server,
  servers,
  currentServerId,
  role,
  pendingRequests,
  rooms,
  currentRoomId,
  userCard,
  members,
  onSelectRoom,
  onBackToHub,
  onSelectServer,
  pendingSwitch,
  onConfirmSwitch,
  onDismissSwitch,
  onOpenServerSettings,
  onLeaveServer,
}: ServerSidebarViewProps) {
  const { t } = useTranslation()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const canManage = role !== 'member'

  const [isSwitcherOpen, setSwitcherOpen] = useState(false)
  const [isLeaveOpen, setLeaveOpen] = useState(false)

  const pendingLabel = pendingRequests > 9 ? '9+' : String(pendingRequests)

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-4">
        <div className="flex h-9 items-center justify-between gap-2 pl-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-0">
          <button
            type="button"
            onClick={onBackToHub}
            aria-label={t('common.backToHub')}
            title={t('common.backToHub')}
            className="focus-visible:ring-ring/50 rounded-md outline-none focus-visible:ring-3 group-data-[collapsible=icon]:hidden"
          >
            <BrandLogo className="w-20" />
          </button>
          <SidebarTrigger aria-label={t('server.toggleSidebar')} title={t('server.toggleSidebar')} />
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <Popover open={isSwitcherOpen} onOpenChange={setSwitcherOpen}>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  aria-label={
                    pendingRequests > 0
                      ? `${t('server.switcher.label')}: ${server.name}, ${t('server.pendingRequests', { count: pendingRequests })}`
                      : `${t('server.switcher.label')}: ${server.name}`
                  }
                  className="data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:p-0!"
                >
                  <span className="relative shrink-0">
                    <ServerIcon name={server.name} imageUrl={server.iconUrl} className="size-8 rounded-md text-xs" />
                    {canManage && pendingRequests > 0 && (
                      <span
                        aria-hidden
                        className="ring-sidebar absolute -top-0.5 -right-0.5 hidden size-2.5 rounded-full bg-red-600 ring-2 group-data-[collapsible=icon]:block"
                      />
                    )}
                  </span>
                  <span className="grid min-w-0 flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{server.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{t(`server.roles.${role}`)}</span>
                  </span>
                  {canManage && pendingRequests > 0 && (
                    <span
                      aria-hidden
                      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white tabular-nums"
                    >
                      {pendingLabel}
                    </span>
                  )}
                  <ChevronsUpDownIcon className="text-muted-foreground" aria-hidden />
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent side={state === 'collapsed' ? 'right' : 'bottom'} align="start" className="w-64 p-0">
                <Command>
                  <CommandInput placeholder={t('server.switcher.search')} aria-label={t('server.switcher.search')} />
                  <CommandList>
                    <CommandEmpty>{t('server.switcher.empty')}</CommandEmpty>
                    <CommandGroup heading={t('hub.servers')}>
                      {servers.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${item.name} ${item.id}`}
                          data-checked={item.id === currentServerId}
                          onSelect={() => {
                            setSwitcherOpen(false)
                            if (item.id !== currentServerId) onSelectServer(item.id)
                          }}
                        >
                          <ServerIcon name={item.name} imageUrl={item.iconUrl} />
                          <span className="truncate">{item.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup>
                      {canManage ? (
                        <CommandItem
                          value="__settings"
                          onSelect={() => {
                            setSwitcherOpen(false)
                            onOpenServerSettings()
                          }}
                        >
                          <SettingsIcon />
                          <span className="flex-1">{t('server.serverSettings')}</span>
                          {pendingRequests > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white tabular-nums">
                              {pendingLabel}
                            </span>
                          )}
                        </CommandItem>
                      ) : (
                        <CommandItem
                          value="__leave"
                          className="text-red-600 data-selected:text-red-600 dark:text-red-400 dark:data-selected:text-red-400 [&_svg]:text-current!"
                          onSelect={() => {
                            setSwitcherOpen(false)
                            setLeaveOpen(true)
                          }}
                        >
                          <LogOutIcon />
                          {t('server.leaveServer')}
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {isLeaveOpen && (
        <ConfirmDialog
          defaultOpen
          onClose={() => setLeaveOpen(false)}
          title={t('server.leaveServerTitle', { server: server.name })}
          description={t('server.leaveServerDescription')}
          confirmLabel={t('server.leaveServerConfirm')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={onLeaveServer}
        />
      )}

      {pendingSwitch && (
        <ConfirmDialog
          key={pendingSwitch.serverName}
          defaultOpen
          onClose={onDismissSwitch}
          title={t('server.switcher.confirmTitle', { server: pendingSwitch.serverName })}
          description={t('server.switcher.confirmDescription', { room: pendingSwitch.roomName })}
          confirmLabel={t('server.switcher.confirm')}
          cancelLabel={t('common.cancel')}
          destructive
          onConfirm={onConfirmSwitch}
        />
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('server.rooms')}</SidebarGroupLabel>
          {rooms.length === 0 ? (
            <p className="text-muted-foreground px-2 text-sm group-data-[collapsible=icon]:hidden">
              {t('server.noRooms')}
            </p>
          ) : (
            <SidebarMenu>
              {rooms.map((room) => {
                const isCurrent = room.id === currentRoomId
                return (
                  <SidebarMenuItem key={room.id}>
                    <SidebarMenuButton
                      isActive={isCurrent}
                      tooltip={room.name}
                      onClick={() => {
                        // On phones the sidebar is a sheet over the stage; close it so the room shows.
                        if (isMobile) setOpenMobile(false)
                        onSelectRoom(room.id)
                      }}
                      aria-current={isCurrent ? 'true' : undefined}
                      aria-label={
                        isCurrent
                          ? `${room.name}, ${t('server.youAreHere')}`
                          : t('server.joinRoom', { room: room.name })
                      }
                    >
                      <AudioLinesIcon />
                      <span>{room.name}</span>
                    </SidebarMenuButton>
                    {room.participants.length > 0 && (
                      <>
                        <SidebarMenuBadge className="text-muted-foreground">
                          {room.participants.length}
                        </SidebarMenuBadge>
                        <SidebarMenuSub>
                          {room.participants.map((participant) => (
                            <SidebarMenuSubItem
                              key={participant.id}
                              className="flex h-8 items-center gap-2 px-2 text-sm"
                            >
                              <UserAvatar
                                name={participant.name}
                                imageUrl={participant.avatarUrl}
                                size="sm"
                                className={cn('size-5', participant.isSpeaking && 'ring-2 ring-emerald-500')}
                              />
                              <span className="min-w-0 flex-1 truncate">{participant.name}</span>
                              {participant.isLive && (
                                <RadioIcon className="size-3.5 text-red-500" role="img" aria-label={t('share.live')} />
                              )}
                              <ParticipantStatusView
                                isMuted={participant.isMuted}
                                isDeafened={participant.isDeafened}
                              />
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          )}
        </SidebarGroup>
        {members}
      </SidebarContent>

      <SidebarFooter>{userCard}</SidebarFooter>
      <SidebarRail aria-label={t('server.toggleSidebar')} title={t('server.toggleSidebar')} />
    </Sidebar>
  )
}

export { ServerSidebarView }
export type { ServerRole, ServerSidebarViewProps }
