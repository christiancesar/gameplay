/** The user fields a name can come from. Better Auth's `name` is set at sign up and never follows a rename. */
type NamedUser = { displayUsername?: string | null; username?: string | null; name?: string | null }

/** The name shown for a person: the username as typed, then the stored username, then the sign up name. */
function displayNameOf(user: NamedUser): string {
  return user.displayUsername || user.username || user.name || ''
}

export { displayNameOf }
export type { NamedUser }
