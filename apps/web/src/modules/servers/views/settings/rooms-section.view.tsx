import { AudioLinesIcon, CheckIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { FieldError } from '@/shared/ui/field'
import { IconButton } from '@/shared/ui/icon-button'
import { Input } from '@/shared/ui/input'

type RoomItem = {
  id: string
  name: string
  occupants: number
}

type RoomNameError = 'nameRequired' | 'nameTaken'

type RoomsSectionViewProps = {
  rooms: readonly RoomItem[]
  roomLimit: number
  newRoomName: string
  newRoomError?: RoomNameError
  isCreating: boolean
  /** Sala em edição de nome, com o texto atual. */
  editing?: { roomId: string; name: string; error?: RoomNameError }
  onNewRoomNameChange: (value: string) => void
  onCreate: () => void
  onStartRename: (roomId: string) => void
  onRenameChange: (value: string) => void
  onRenameSave: () => void
  onRenameCancel: () => void
  onDelete: (roomId: string) => void
}

function RoomsSectionView({
  rooms,
  roomLimit,
  newRoomName,
  newRoomError,
  isCreating,
  editing,
  onNewRoomNameChange,
  onCreate,
  onStartRename,
  onRenameChange,
  onRenameSave,
  onRenameCancel,
  onDelete,
}: RoomsSectionViewProps) {
  const { t } = useTranslation()
  const atLimit = rooms.length >= roomLimit

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">{t('serverSettings.rooms.count', { count: rooms.length, max: roomLimit })}</p>

      {atLimit ? (
        <Alert>
          <AlertDescription>{t('serverSettings.rooms.blockedLimit', { count: rooms.length, max: roomLimit })}</AlertDescription>
        </Alert>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onCreate()
          }}
        >
          <div className="flex gap-2">
            <Input
              aria-label={t('serverSettings.rooms.newRoom')}
              placeholder={t('serverSettings.rooms.newRoom')}
              value={newRoomName}
              maxLength={40}
              aria-invalid={Boolean(newRoomError)}
              onChange={(event) => onNewRoomNameChange(event.target.value)}
            />
            <Button type="submit" disabled={isCreating} aria-busy={isCreating}>
              <PlusIcon data-icon="inline-start" aria-hidden />
              {t('serverSettings.rooms.create')}
            </Button>
          </div>
          {newRoomError && <FieldError>{t(`serverSettings.rooms.errors.${newRoomError}`)}</FieldError>}
        </form>
      )}

      <ul className="divide-y rounded-md border">
        {rooms.map((room) => {
          const isEditing = editing?.roomId === room.id
          return (
            <li key={room.id} className="flex items-center gap-3 px-4 py-2.5">
              <AudioLinesIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
              {isEditing ? (
                <form
                  noValidate
                  className="flex flex-1 flex-col gap-1"
                  onSubmit={(event) => {
                    event.preventDefault()
                    onRenameSave()
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      aria-label={t('serverSettings.rooms.rename')}
                      value={editing.name}
                      maxLength={40}
                      aria-invalid={Boolean(editing.error)}
                      onChange={(event) => onRenameChange(event.target.value)}
                      onKeyDown={(event) => event.key === 'Escape' && onRenameCancel()}
                    />
                    <IconButton type="submit" label={t('common.save')} icon={<CheckIcon />} />
                    <IconButton label={t('common.cancel')} icon={<XIcon />} onClick={onRenameCancel} />
                  </div>
                  {editing.error && <FieldError>{t(`serverSettings.rooms.errors.${editing.error}`)}</FieldError>}
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{room.name}</p>
                    {room.occupants > 0 && (
                      <p className="text-muted-foreground text-xs">{t('serverSettings.rooms.occupants', { count: room.occupants })}</p>
                    )}
                  </div>
                  <IconButton label={`${t('serverSettings.rooms.rename')} ${room.name}`} icon={<PencilIcon />} onClick={() => onStartRename(room.id)} />
                  <ConfirmDialog
                    trigger={<IconButton label={`${t('serverSettings.rooms.delete')} ${room.name}`} icon={<Trash2Icon />} className="text-destructive" />}
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
export type { RoomItem, RoomNameError, RoomsSectionViewProps }
