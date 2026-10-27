import {
  serverMediaSchema,
  sfuCloseResponseSchema,
  sfuSessionResponseSchema,
  sfuTracksResponseSchema,
  type ServerMedia,
} from '@gameplay/contracts'

import { http } from '@/shared/lib/http'
import type { SfuSignaling } from '@/shared/media/sfu-connection'

/** `/api/media/sfu`: the API negotiates with Cloudflare for the browser. */
const sfuSignaling: SfuSignaling = {
  createSession: async () => sfuSessionResponseSchema.parse((await http.post('/media/sfu/sessions')).data).sessionId,
  publish: async (sessionId, offer, tracks) =>
    sfuTracksResponseSchema.parse(
      (await http.post(`/media/sfu/sessions/${sessionId}/publish`, { sessionDescription: offer, tracks })).data,
    ),
  watch: async (sessionId, streamerId, layer) =>
    sfuTracksResponseSchema.parse(
      (await http.post(`/media/sfu/sessions/${sessionId}/watch`, { streamerId, layer })).data,
    ),
  renegotiate: async (sessionId, answer) => {
    await http.put(`/media/sfu/sessions/${sessionId}/renegotiate`, { sessionDescription: answer })
  },
  setLayer: async (sessionId, mid, layer) => {
    await http.put(`/media/sfu/sessions/${sessionId}/layer`, { mid, layer })
  },
  close: async (sessionId, mids) => {
    if (mids.length === 0) return
    sfuCloseResponseSchema.parse((await http.put(`/media/sfu/sessions/${sessionId}/close`, { mids })).data)
  },
}

/** What the server offers now: SFU, Mesh and TURN, as the platform admin set them. */
async function getServerMedia(serverId: string): Promise<ServerMedia> {
  const { data } = await http.get(`/servers/${serverId}/media`)
  return serverMediaSchema.parse(data)
}

export { getServerMedia, sfuSignaling }
