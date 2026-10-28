import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  ROOM_NAME_MAX,
  roomNameSchema,
  type RoomNameError,
  type RoomNameValues,
} from '@/modules/servers/model/room.schema'
import { FieldError } from '@/shared/ui/field'
import { IconButton } from '@/shared/ui/icon-button'
import { Input } from '@/shared/ui/input'

type RenameRoomFormProps = {
  name: string
  takenNames: readonly string[]
  onSave: (name: string) => void
  onCancel: () => void
}

function RenameRoomForm({ name, takenNames, onSave, onCancel }: RenameRoomFormProps) {
  const { t } = useTranslation()
  const form = useForm<RoomNameValues>({ resolver: zodResolver(roomNameSchema(takenNames)), defaultValues: { name } })
  const error = form.formState.errors.name?.message as RoomNameError | undefined

  return (
    <form
      noValidate
      className="flex flex-1 flex-col gap-1"
      onSubmit={form.handleSubmit((values) => onSave(values.name))}
    >
      <div className="flex items-center gap-1">
        <Input
          {...form.register('name')}
          autoFocus
          aria-label={t('serverSettings.rooms.rename')}
          maxLength={ROOM_NAME_MAX + 20}
          aria-invalid={Boolean(error)}
          onKeyDown={(event) => event.key === 'Escape' && onCancel()}
        />
        <IconButton type="submit" label={t('common.save')} icon={<CheckIcon />} />
        <IconButton label={t('common.cancel')} icon={<XIcon />} onClick={onCancel} />
      </div>
      {error && <FieldError>{t(`serverSettings.rooms.errors.${error}`)}</FieldError>}
    </form>
  )
}

export { RenameRoomForm }
export type { RenameRoomFormProps }
