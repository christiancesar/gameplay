import { z } from 'zod'

import type { SignalKind } from './media-transport'

const descriptionSchema = z.object({ type: z.enum(['offer', 'answer']), sdp: z.string() })
const candidateSchema = z.object({
  candidate: z.string(),
  sdpMid: z.string().nullish(),
  sdpMLineIndex: z.number().nullish(),
  usernameFragment: z.string().nullish(),
})

const offerAnswerSchema = z.object({ epoch: z.string().min(1), description: descriptionSchema })
const candidatePayloadSchema = z.object({ epoch: z.string().min(1), candidate: candidateSchema })

type SignalPayload =
  | { epoch: string; description: z.infer<typeof descriptionSchema> }
  | { epoch: string; candidate: RTCIceCandidateInit }

/**
 * What goes inside `signal:send`'s opaque `data`. `epoch` identifies one peer connection of the sender:
 * when it changes the other side knows the connection was rebuilt and starts over too.
 */
function parseSignalPayload(kind: SignalKind, data: unknown): SignalPayload | null {
  const result = (kind === 'candidate' ? candidatePayloadSchema : offerAnswerSchema).safeParse(data)
  if (!result.success) return null
  if (kind !== 'candidate' && 'description' in result.data && result.data.description.type !== kind) return null
  return result.data as SignalPayload
}

export { parseSignalPayload }
export type { SignalPayload }
