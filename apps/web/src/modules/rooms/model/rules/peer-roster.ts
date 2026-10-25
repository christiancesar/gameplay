/** Who to connect to and who to drop when the roster changes. Excludes the local user. */
function diffPeers(known: ReadonlySet<string>, roster: readonly string[], selfId: string) {
  const wanted = new Set(roster.filter((id) => id !== selfId))
  return {
    added: [...wanted].filter((id) => !known.has(id)),
    removed: [...known].filter((id) => !wanted.has(id)),
  }
}

export { diffPeers }
