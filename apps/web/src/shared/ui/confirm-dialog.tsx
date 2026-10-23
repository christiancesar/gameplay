import { useState, type ReactNode } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

type ConfirmDialogProps = {
  trigger: ReactNode
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  /** Quando presente, o botão só libera depois de digitar este texto. */
  typeToConfirm?: { value: string; label: string }
  onConfirm: () => void
}

function ConfirmDialog({ trigger, title, description, confirmLabel, cancelLabel, destructive, typeToConfirm, onConfirm }: ConfirmDialogProps) {
  // Texto digitado é estado de apresentação do próprio diálogo.
  const [typed, setTyped] = useState('')
  const locked = typeToConfirm ? typed.trim() !== typeToConfirm.value : false

  return (
    <AlertDialog onOpenChange={(open) => !open && setTyped('')}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {typeToConfirm && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-dialog-input">{typeToConfirm.label}</Label>
            <Input id="confirm-dialog-input" autoComplete="off" value={typed} onChange={(event) => setTyped(event.target.value)} />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? 'destructive' : 'default'} disabled={locked} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
