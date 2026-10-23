import { useMemo } from 'react'
import type { FieldErrors, FieldValues } from 'react-hook-form'

/**
 * Erros que só o servidor conhece (ex.: username em uso), no formato do `errors` do useForm.
 * A mensagem é a chave de i18n. Some quando o campo volta a validar.
 */
function useServerErrors<T extends FieldValues>(errors: Partial<Record<keyof T & string, string>> | undefined) {
  return useMemo(() => {
    if (!errors) return undefined
    const entries = Object.entries(errors).filter((entry): entry is [string, string] => Boolean(entry[1]))
    if (entries.length === 0) return undefined
    return Object.fromEntries(entries.map(([field, message]) => [field, { type: 'server', message }])) as FieldErrors<T>
  }, [errors])
}

export { useServerErrors }
