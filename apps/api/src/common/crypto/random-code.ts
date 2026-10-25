import { randomInt } from 'node:crypto'

// Random characters from the alphabet, from the OS's secure generator.
export function randomCode(alphabet: string, length: number): string {
  let code = ''
  for (let i = 0; i < length; i++) code += alphabet[randomInt(alphabet.length)]
  return code
}
