import { Loader2Icon } from 'lucide-react'

import { Button } from '@/shared/ui/button'

type SubmitButtonProps = {
  isSubmitting: boolean
  label: string
  disabled?: boolean
}

function SubmitButton({ isSubmitting, label, disabled = false }: SubmitButtonProps) {
  return (
    <Button type="submit" size="lg" disabled={isSubmitting || disabled} aria-busy={isSubmitting}>
      {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
      {label}
    </Button>
  )
}

export { SubmitButton }
export type { SubmitButtonProps }
