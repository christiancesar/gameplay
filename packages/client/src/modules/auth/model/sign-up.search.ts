import { z } from 'zod'

const signUpSearchSchema = z.object({
  /** Código do convite de servidor que trouxe a pessoa ao cadastro (F3). */
  invite: z.string().optional(),
})

type SignUpSearch = z.infer<typeof signUpSearchSchema>

export { signUpSearchSchema }
export type { SignUpSearch }
