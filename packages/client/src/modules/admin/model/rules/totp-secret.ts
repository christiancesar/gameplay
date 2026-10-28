/** The shared secret inside an `otpauth://` URI, for people who type it instead of scanning the QR. */
function totpSecret(totpUri: string): string {
  try {
    return new URL(totpUri).searchParams.get('secret') ?? ''
  } catch {
    return ''
  }
}

export { totpSecret }
