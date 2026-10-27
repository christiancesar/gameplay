// Passwords the admin generates for a reset. Tests use a fixed one.
export abstract class PasswordGenerator {
  abstract generate(): string
}
