/** No 0/O, 1/l/I: the admin passes the password on by voice or chat. */
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const PASSWORD_LENGTH = 16

/** Random password for the reset dialog. `random` is injectable so specs are deterministic. */
function generatePassword(random: (size: number) => Uint32Array = randomValues): string {
  return Array.from(random(PASSWORD_LENGTH), (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join('')
}

function randomValues(size: number): Uint32Array {
  return crypto.getRandomValues(new Uint32Array(size))
}

export { generatePassword, PASSWORD_ALPHABET, PASSWORD_LENGTH }
