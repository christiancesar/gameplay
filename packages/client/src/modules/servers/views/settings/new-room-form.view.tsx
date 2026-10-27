import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  ROOM_NAME_MAX,
  roomNameSchema,
  type RoomNameError,
  type RoomNameValues,
} from '@/modules/servers/model/room.schema'
import { Button } from '@/shared/ui/button'
import { FieldError } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'

type NewRoomFormProps = {
  takenNames: readonly string[]
  isCreating: boolean
  onCreate: (name: string) => void
}

function NewRoomForm({ takenNames, isCreating, onCreate }: NewRoomFormProps) {
  const { t } = useTranslation()
  const form = useForm<RoomNameValues>({
    resolver: zodResolver(roomNameSchema(takenNames)),
    defaultValues: { name: '' },
  })
  const error = form.formState.errors.name?.message as RoomNameError | undefined

  return (
    <form noValidate className="flex flex-col gap-2" onSubmit={form.handleSubmit(({ name }) => onCreate(name))}>
      <div className="flex gap-2">
        <Input
          {...form.register('name')}
          aria-label={t('serverSettings.rooms.newRoom')}
          placeholder={t('serverSettings.rooms.newRoom')}
          maxLength={ROOM_NAME_MAX + 20}
          aria-invalid={Boolean(error)}
        />
        <Button type="submit" disabled={isCreating} aria-busy={isCreating}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          {t('serverSettings.rooms.create')}
        </Button>
      </div>
      {error && <FieldError>{t(`serverSettings.rooms.errors.${error}`)}</FieldError>}
    </form>
  )
}

export { NewRoomForm }
export type { NewRoomFormProps }
