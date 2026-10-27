import type { Participant, RoomOccupancy, StreamMode, StreamPreset } from '@gameplay/contracts'

// A person's place in a voice room. socketId is the tab that joined; null
// while that socket is gone and the seat waits for a reconnection.
export type Seat = {
  userId: string
  serverId: string
  roomId: string
  socketId: string | null
  muted: boolean
  deafened: boolean
  streaming: StreamPreset | null
  streamMode: StreamMode | null
}

export type JoinInput = Pick<Seat, 'userId' | 'serverId' | 'roomId' | 'muted' | 'deafened'> & { socketId: string }

// Rejoining the same room (a reconnection or another tab) keeps the screen
// share; entering another room starts without one.
export function seatAfterJoin(previous: Seat | null, input: JoinInput): Seat {
  const sameRoom = previous?.roomId === input.roomId
  return {
    ...input,
    streaming: sameRoom ? previous.streaming : null,
    streamMode: sameRoom ? previous.streamMode : null,
  }
}

// The tab that held the seat before this join, when it is another one and
// still connected: it has to be told it is out.
export function displacedSocket(previous: Seat | null, socketId: string): string | null {
  return previous?.socketId && previous.socketId !== socketId ? previous.socketId : null
}

export function toParticipant({ userId, muted, deafened, streaming, streamMode }: Seat): Participant {
  return { userId, muted, deafened, streaming, streamMode }
}

// Seats of a server grouped by room, rooms in order of their first seat.
export function occupancy(seats: Seat[]): RoomOccupancy[] {
  const rooms = new Map<string, RoomOccupancy>()
  for (const seat of seats) {
    const room = rooms.get(seat.roomId) ?? { roomId: seat.roomId, participants: [] }
    room.participants.push(toParticipant(seat))
    rooms.set(seat.roomId, room)
  }
  return [...rooms.values()]
}
