import type { AddressInfo } from 'node:net'
import type { INestApplication } from '@nestjs/common'
import type { ClientToServerEvents, RoomParticipants, ServerToClientEvents } from '@gameplay/contracts'
import { io, type Socket } from 'socket.io-client'

export type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>

// The app must be listening (app.listen(0)) for clients to connect.
export function socketUrl(app: INestApplication): string {
  const { port } = app.getHttpServer().address() as AddressInfo
  return `http://localhost:${port}`
}

// Connects with the given Cookie header; resolves once connected and rejects
// with the connect_error otherwise.
export function connectSocket(app: INestApplication, cookie?: string): Promise<TestSocket> {
  const socket: TestSocket = io(socketUrl(app), {
    transports: ['websocket'],
    reconnection: false,
    forceNew: true,
    extraHeaders: cookie ? { cookie } : {},
  })
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', (error) => {
      socket.close()
      reject(error)
    })
  })
}

// Resolves with the payload of the next event of that name.
export function nextEvent<E extends keyof ServerToClientEvents>(
  socket: TestSocket,
  event: E,
  timeoutMs = 2_000,
): Promise<Parameters<ServerToClientEvents[E]>[0]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No ${event} within ${timeoutMs} ms`)), timeoutMs)
    socket.once(
      event as never,
      ((payload: unknown) => {
        clearTimeout(timer)
        resolve(payload as never)
      }) as never,
    )
  })
}

// Resolves with the first room:participants of that room that passes `check`.
export function participantsWhere(
  socket: TestSocket,
  roomId: string,
  check: (payload: RoomParticipants) => boolean,
): Promise<RoomParticipants> {
  return new Promise((resolve) => {
    const listener = (payload: RoomParticipants) => {
      if (payload.roomId !== roomId || !check(payload)) return
      socket.off('room:participants', listener)
      resolve(payload)
    }
    socket.on('room:participants', listener)
  })
}

// Everything the socket got for that event during a short wait; [] proves
// that nothing came.
export async function collectFor<E extends keyof ServerToClientEvents>(
  socket: TestSocket,
  event: E,
  ms = 150,
): Promise<unknown[]> {
  const got: unknown[] = []
  const listener = (payload: unknown) => got.push(payload)
  socket.on(event as never, listener as never)
  await new Promise((resolve) => setTimeout(resolve, ms))
  socket.off(event as never, listener as never)
  return got
}
