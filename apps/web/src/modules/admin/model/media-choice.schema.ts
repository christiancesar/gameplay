import { z } from 'zod'

/** Escolha de um recurso de mídia num servidor: seguir o global, ou ligado/desligado só nele. */
const mediaChoiceSchema = z.enum(['global', 'on', 'off'])

type MediaChoice = z.infer<typeof mediaChoiceSchema>

export { mediaChoiceSchema }
export type { MediaChoice }
