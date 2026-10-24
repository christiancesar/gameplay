import { z } from 'zod'

/** Mensagens dos schemas: chaves de `serverSettings.rooms.errors`, a View traduz. */
type RoomNameError = 'nameRequired' | 'nameTooLong' | 'nameTaken'

const ROOM_NAME_MAX = 40

const message = (key: RoomNameError) => key

/** Nome de sala único no servidor, sem diferenciar maiúsculas. `takenNames` exclui a própria sala ao renomear. */
function roomNameSchema(takenNames: readonly string[]) {
  const taken = new Set(takenNames.map((name) => name.trim().toLowerCase()))
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, message('nameRequired'))
      .max(ROOM_NAME_MAX, message('nameTooLong'))
      .refine((name) => !taken.has(name.toLowerCase()), message('nameTaken')),
  })
}

type RoomNameValues = z.infer<ReturnType<typeof roomNameSchema>>

export { ROOM_NAME_MAX, roomNameSchema }
export type { RoomNameError, RoomNameValues }
