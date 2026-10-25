import { z } from 'zod'

// One entry of RTCConfiguration.iceServers. STUN entries have no credentials.
export const iceServerSchema = z.object({
  urls: z.array(z.string()),
  username: z.string().optional(),
  credential: z.string().optional(),
})
export type IceServer = z.infer<typeof iceServerSchema>

export const iceConfigResponseSchema = z.object({
  iceServers: z.array(iceServerSchema),
  // How long the TURN credentials stay valid from now; ask again after that.
  ttlSeconds: z.number().int().min(0),
  // Client IP seen by the HTTP request. The web compares it with the public
  // IP found through STUN to warn about a VPN or proxy.
  requestIp: z.string().nullable(),
})
export type IceConfigResponse = z.infer<typeof iceConfigResponseSchema>
