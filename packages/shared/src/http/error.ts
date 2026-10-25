import { z } from 'zod'

// Body of every error response from the API.
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    // Validation issues, keyed by field path ("email", "address.city").
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
export type ErrorBody = ErrorResponse['error']
