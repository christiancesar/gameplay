import { z } from 'zod'

import { normalizeServerAddress } from './rules/normalize-server-address'

/** Endereço do servidor. Mensagens: chaves de `serverChoice.errors`. */
const serverAddressSchema = z.object({
  address: z
    .string()
    .trim()
    .min(1, 'required')
    .refine((value) => normalizeServerAddress(value) !== null, 'invalid'),
})

type ServerAddressValues = z.infer<typeof serverAddressSchema>

export { serverAddressSchema }
export type { ServerAddressValues }
