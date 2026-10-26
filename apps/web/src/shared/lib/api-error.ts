import { errorResponseSchema, type ErrorBody } from '@gameplay/contracts'
import { isAxiosError } from 'axios'

/** Erro da API no formato do contrato (`{ error: { code, message, fields } }`). */
class ApiError extends Error {
  readonly code: string
  readonly status: number | undefined
  readonly fields: ErrorBody['fields']

  constructor(body: ErrorBody, status?: number) {
    super(body.message)
    this.name = 'ApiError'
    this.code = body.code
    this.status = status
    this.fields = body.fields
  }
}

/** Converte qualquer falha de requisição em ApiError. Sem resposta vira NETWORK_ERROR. */
function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isAxiosError(error)) {
    const parsed = errorResponseSchema.safeParse(error.response?.data)
    if (parsed.success) return new ApiError(parsed.data.error, error.response?.status)
    if (!error.response) return new ApiError({ code: 'NETWORK_ERROR', message: error.message })
    return new ApiError({ code: 'UNKNOWN_ERROR', message: error.message }, error.response.status)
  }
  return new ApiError({ code: 'UNKNOWN_ERROR', message: error instanceof Error ? error.message : String(error) })
}

export { ApiError, toApiError }
