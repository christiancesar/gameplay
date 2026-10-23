import { Loader2Icon } from 'lucide-react'

import { Button } from '@/shared/ui/button'

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
      {isSubmitting && <Loader2Icon className="animate-spin" aria-hidden />}
      {label}
    </Button>
  )
}

export { SubmitButton }
