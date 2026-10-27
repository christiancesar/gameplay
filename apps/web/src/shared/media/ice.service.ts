import { iceConfigResponseSchema, type IceConfigResponse } from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

/** ICE servers for WebRTC plus the IP the API saw (used by the VPN notice). */
/** With the room's server: the platform admin may have turned TURN off there. */
async function getIceConfig(serverId?: string): Promise<IceConfigResponse> {
  const { data } = await http.get('/ice', serverId ? { params: { serverId } } : undefined)
  return iceConfigResponseSchema.parse(data)
}

export { getIceConfig }
