import { z } from 'zod'

/** Orçamento mensal do SFU, em GB. Mensagens: chaves de `admin.media.budget.errors`. */
const sfuBudgetSchema = z.object({
  budgetGb: z.number({ error: 'invalid' }).int('invalid').min(0, 'invalid').max(100_000, 'invalid'),
})

type SfuBudgetValues = z.infer<typeof sfuBudgetSchema>

export { sfuBudgetSchema }
export type { SfuBudgetValues }
