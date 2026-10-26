import { iceConfigResponseSchema, type IceConfigResponse } from '@gameplay/contracts'

import { http } from '@/shared/lib/http'

/** ICE servers for WebRTC plus the IP the API saw (used by the VPN notice). */
async function getIceConfig(): Promise<IceConfigResponse> {
  const { data } = await http.get('/ice')
  return iceConfigResponseSchema.parse(data)
}

export { getIceConfig }
