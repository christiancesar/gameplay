import { z } from 'zod'

/** Etapas do SignIn na mesma rota (F1). A URL nunca leva email ou username. */
const SIGN_IN_STEPS = ['two-factor', 'recovery-code'] as const

const signInSearchSchema = z.object({
  step: z.enum(SIGN_IN_STEPS).optional(),
  /** Para onde voltar depois do login (ex.: convite de servidor). */
  redirect: z.string().optional(),
})

type SignInSearch = z.infer<typeof signInSearchSchema>

export { SIGN_IN_STEPS, signInSearchSchema }
export type { SignInSearch }
