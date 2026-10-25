import { PasswordGenerator } from '../providers/password-generator'

export const GENERATED_PASSWORD = 'generated-pass-123'

export class FixedPasswordGenerator extends PasswordGenerator {
  generate(): string {
    return GENERATED_PASSWORD
  }
}
