import { ArrowDownIcon, ArrowUpIcon, AudioLinesIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/shared/ui/alert'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { IconButton } from '@/shared/ui/icon-button'

import { NewRoomForm } from './new-room-form.view'
import { RenameRoomForm } from './rename-room-form.view'

type RoomItem = {
  id: string
  name: string
  occupants: number
}

type RoomsSectionViewProps = {
  rooms: readonly RoomItem[]
  roomLimit: number
  isCreating: boolean
  /** Sala com o nome em edição. */
  editingRoomId?: string
  /** Chamados só com nomes que passaram no schema (preenchido, até 40 caracteres, sem repetir). */
  onCreate: (name: string) => void
  onStartRename: (roomId: string) => void
  onRename: (roomId: string, name: string) => void
  onRenameCancel: () => void
  /** Troca a sala de lugar com a vizinha. A ordem vale para a sidebar de todos. */
  onMove: (roomId: string, direction: 'up' | 'down') => void
  onDelete: (roomId: string) => void
}

function RoomsSectionView({
  rooms,
  roomLimit,
  isCreating,
  editingRoomId,
  onCreate,
  onStartRename,
  onRename,
  onRenameCancel,
  onMove,
  onDelete,
}: RoomsSectionViewProps) {
  const { t } = useTranslation()
  const atLimit = rooms.length >= roomLimit

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        {t('serverSettings.rooms.count', { count: rooms.length, max: roomLimit })}
      </p>

      {atLimit ? (
        <Alert>
          <AlertDescription>
            {t('serverSettings.rooms.blockedLimit', { count: rooms.length, max: roomLimit })}
          </AlertDescription>
        </Alert>
      ) : (
        // A key limpa o campo quando a sala criada entra na lista.
        <NewRoomForm
          key={rooms.length}
          takenNames={rooms.map((room) => room.name)}
          isCreating={isCreating}
          onCreate={onCreate}
        />
      )}

      <ul className="divide-y rounded-md border">
        {rooms.map((room, index) => {
          const isEditing = editingRoomId === room.id
          return (
            <li key={room.id} className="flex items-center gap-3 px-4 py-2.5">
              <AudioLinesIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
              {isEditing ? (
                <RenameRoomForm
                  name={room.name}
                  takenNames={rooms.filter((other) => other.id !== room.id).map((other) => other.name)}
                  onSave={(name) => onRename(room.id, name)}
                  onCancel={onRenameCancel}
                />
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{room.name}</p>
                    {room.occupants > 0 && (
                      <p className="text-muted-foreground text-xs">
                        {t('serverSettings.rooms.occupants', { count: room.occupants })}
                      </p>
                    )}
                  </div>
                  <IconButton
                    label={`${t('serverSettings.rooms.moveUp')} ${room.name}`}
                    icon={<ArrowUpIcon />}
                    disabled={index === 0}
                    onClick={() => onMove(room.id, 'up')}
                  />
                  <IconButton
                    label={`${t('serverSettings.rooms.moveDown')} ${room.name}`}
                    icon={<ArrowDownIcon />}
                    disabled={index === rooms.length - 1}
                    onClick={() => onMove(room.id, 'down')}
                  />
                  <IconButton
                    label={`${t('serverSettings.rooms.rename')} ${room.name}`}
                    icon={<PencilIcon />}
                    onClick={() => onStartRename(room.id)}
                  />
                  <ConfirmDialog
                    trigger={
                      <IconButton
                        label={`${t('serverSettings.rooms.delete')} ${room.name}`}
                        icon={<Trash2Icon />}
                        className="text-destructive"
                      />
                    }
                    title={t('serverSettings.rooms.deleteTitle', { name: room.name })}
                    description={
                      room.occupants > 0
                        ? `${t('serverSettings.rooms.deleteOccupied', { count: room.occupants })} ${t('serverSettings.rooms.deleteDescription')}`
                        : t('serverSettings.rooms.deleteDescription')
                    }
                    confirmLabel={t('serverSettings.rooms.delete')}
                    cancelLabel={t('common.cancel')}
                    destructive
                    onConfirm={() => onDelete(room.id)}
                  />
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export { RoomsSectionView }
export type { RoomItem, RoomsSectionViewProps }
