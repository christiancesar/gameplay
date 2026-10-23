import { useMemo } from 'react'
import type { FieldErrors, FieldValues } from 'react-hook-form'

/**
 * Erros que só o servidor conhece (ex.: username em uso), no formato do `errors` do useForm.
 * A mensagem é a chave de i18n. Some quando o campo volta a validar.
 * Compara pelo conteúdo: um objeto novo a cada render não reaplica os erros (o useForm entraria em loop).
 */
function useServerErrors<T extends FieldValues>(errors: Partial<Record<keyof T & string, string>> | undefined) {
  const entries = Object.entries(errors ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1]))
  const key = JSON.stringify(entries)

  return useMemo(() => {
    const parsed = JSON.parse(key) as [string, string][]
    if (parsed.length === 0) return undefined
    return Object.fromEntries(parsed.map(([field, message]) => [field, { type: 'server', message }])) as FieldErrors<T>
  }, [key])
}

export { useServerErrors }
