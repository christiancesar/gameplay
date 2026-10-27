import { SERVER_DESCRIPTION_MAX, SERVER_NAME_MAX } from '@gameplay/contracts'
import { z } from 'zod'

/** Mensagens dos schemas: chaves de `createServer.errors`, a View traduz. */
type ServerNameError = 'nameRequired' | 'nameTooLong'

const message = (key: ServerNameError) => key

const serverNameSchema = z.string().trim().min(1, message('nameRequired')).max(SERVER_NAME_MAX, message('nameTooLong'))

const createServerSchema = z.object({ name: serverNameSchema })

const serverGeneralSchema = z.object({
  name: serverNameSchema,
  description: z.string().trim().max(SERVER_DESCRIPTION_MAX),
})

type CreateServerValues = z.infer<typeof createServerSchema>
type ServerGeneralValues = z.infer<typeof serverGeneralSchema>

export { createServerSchema, SERVER_DESCRIPTION_MAX, serverGeneralSchema }
export type { CreateServerValues, ServerGeneralValues, ServerNameError }
