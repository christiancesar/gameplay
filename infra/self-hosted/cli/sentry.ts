/**
 * Where nginx forwards the Sentry tunnel: https://KEY@HOST/PROJECT becomes
 * https://HOST/api/PROJECT/envelope/. Empty without a DSN (the tunnel answers 404).
 */
export function sentryEnvelopeUrl(dsn: string): string {
  if (!dsn) return ''
  const url = new URL(dsn)
  const project = url.pathname.split('/').at(-1)
  return `https://${url.host}/api/${project}/envelope/`
}
