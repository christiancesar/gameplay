import { cn } from 'cn'
import { ImageIcon, Loader2Icon, Trash2Icon, UploadIcon } from 'lucide-react'
import { useId, useRef } from 'react'

import { Button } from '@/shared/ui/button'
import { initialsOf } from '@/shared/ui/initials'

type ImageError = 'tooLarge' | 'invalidType' | 'uploadFailed'

type ImagePickerProps = {
  /** Nome usado no fallback de iniciais (vazio mostra só o ícone). */
  name?: string
  previewUrl?: string
  shape: 'circle' | 'square' | 'cover'
  isUploading?: boolean
  error?: string
  hint: string
  labels: { choose: string; change: string; remove: string }
  onSelectFile: (file: File) => void
  onRemove?: () => void
}

const SHAPE_CLASS = {
  circle: 'size-20 rounded-full',
  square: 'size-20 rounded-md',
  cover: 'aspect-video w-full max-w-72 rounded-md',
} as const

/** Prévia + botões de escolher e remover. A validação de tamanho e formato fica no ViewModel. */
function ImagePicker({ name, previewUrl, shape, isUploading, error, hint, labels, onSelectFile, onRemove }: ImagePickerProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('flex gap-4', shape === 'cover' ? 'flex-col' : 'items-center')}>
      <div
        className={cn(
          'bg-muted text-muted-foreground relative flex shrink-0 items-center justify-center overflow-hidden border text-lg font-semibold',
          SHAPE_CLASS[shape],
          error && 'border-destructive',
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="size-full object-cover" />
        ) : name?.trim() && shape !== 'cover' ? (
          initialsOf(name)
        ) : (
          <ImageIcon className="size-6" aria-hidden />
        )}
        {isUploading && (
          <span className="bg-background/70 absolute inset-0 flex items-center justify-center">
            <Loader2Icon className="size-5 animate-spin" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => inputRef.current?.click()}>
            <UploadIcon data-icon="inline-start" aria-hidden />
            {previewUrl ? labels.change : labels.choose}
          </Button>
          {previewUrl && onRemove && (
            <Button type="button" variant="ghost" size="sm" disabled={isUploading} onClick={onRemove}>
              <Trash2Icon data-icon="inline-start" aria-hidden />
              {labels.remove}
            </Button>
          )}
        </div>
        <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-label={previewUrl ? labels.change : labels.choose}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onSelectFile(file)
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

export { ImagePicker }
export type { ImageError, ImagePickerProps }
