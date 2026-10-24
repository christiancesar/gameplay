/** Até duas iniciais a partir de um nome ("Shinigame" -> "SH", "Room Zero" -> "RZ"). */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
