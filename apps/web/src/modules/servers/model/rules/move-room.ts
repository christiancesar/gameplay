/**
 * Room ids in the order the API expects after moving `roomId` one step.
 * Returns undefined when the room is unknown or already at that end.
 */
function moveRoom(roomIds: readonly string[], roomId: string, direction: 'up' | 'down'): string[] | undefined {
  const from = roomIds.indexOf(roomId)
  const to = direction === 'up' ? from - 1 : from + 1
  if (from === -1 || to < 0 || to >= roomIds.length) return undefined
  const next = [...roomIds]
  ;[next[from], next[to]] = [next[to]!, next[from]!]
  return next
}

export { moveRoom }
