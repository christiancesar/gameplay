import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, RefreshCwIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  CONNECTIONS,
  manualHardwareSchema,
  type ManualHardware,
  type ManualHardwareError,
  type ManualHardwareField,
  type ManualHardwareInput,
} from '@/modules/hardware/model/manual-hardware.schema'
import { DeviceHardwareView, type DeviceHardware, type DisplaysPermission } from '@/modules/hardware/views/device-hardware.view'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SubmitButton } from '@/shared/ui/submit-button'

type HardwareSectionViewProps = {
  hardware: DeviceHardware
  displaysPermission: DisplaysPermission
  lastSentAt?: string
  isCollecting: boolean
  /** Complemento já salvo, como texto, para preencher o formulário. */
  defaultManual?: Partial<ManualHardwareInput>
  isSavingManual: boolean
  manualSaved: boolean
  onRefresh: () => void
  onAllowDisplays: () => void
  /** Chamado só com dados que passaram no schema: números convertidos, vazios como undefined. */
  onSaveManual: (values: ManualHardware) => void
}

function HardwareSectionView({
  hardware,
  displaysPermission,
  lastSentAt,
  isCollecting,
  defaultManual,
  isSavingManual,
  manualSaved,
  onRefresh,
  onAllowDisplays,
  onSaveManual,
}: HardwareSectionViewProps) {
  const { t, i18n } = useTranslation()
  const form = useForm<ManualHardwareInput, unknown, ManualHardware>({
    resolver: zodResolver(manualHardwareSchema),
    defaultValues: { cpuModel: '', ramGb: '', gpuModel: '', vramGb: '', connection: '', downloadMbps: '', uploadMbps: '', ...defaultManual },
  })

  const textField = (name: Exclude<ManualHardwareField, 'connection'>, props: { placeholder?: string; numeric?: boolean } = {}) => {
    const error = form.formState.errors[name]?.message as ManualHardwareError | undefined
    return (
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor={`hw-${name}`}>{t(`hardware.manual.${name}`)}</FieldLabel>
        <Input
          {...form.register(name)}
          id={`hw-${name}`}
          inputMode={props.numeric ? 'decimal' : undefined}
          placeholder={props.placeholder}
          aria-invalid={Boolean(error)}
        />
        {error && <FieldError>{t(`hardware.manual.errors.${error}`)}</FieldError>}
      </Field>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">{t('hardware.description')}</p>
          {lastSentAt && <p className="text-muted-foreground text-xs">{t('hardware.lastSent', { date: formatRelativeTime(lastSentAt, i18n.language) })}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isCollecting} aria-busy={isCollecting}>
          <RefreshCwIcon data-icon="inline-start" className={isCollecting ? 'animate-spin' : undefined} aria-hidden />
          {t('hardware.refresh')}
        </Button>
      </div>

      <DeviceHardwareView hardware={hardware} displaysPermission={displaysPermission} onAllowDisplays={onAllowDisplays} />

      <form
        noValidate
        className="flex flex-col gap-4 rounded-md border p-4"
        onSubmit={form.handleSubmit(onSaveManual)}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{t('hardware.manual.title')}</h3>
          <p className="text-muted-foreground text-xs">{t('hardware.manual.description')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          {textField('cpuModel', { placeholder: t('hardware.manual.cpuModelPlaceholder') })}
          {textField('ramGb', { numeric: true })}
          {textField('gpuModel', { placeholder: t('hardware.manual.gpuModelPlaceholder') })}
          {textField('vramGb', { numeric: true })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Controller
            name="connection"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="hw-connection">{t('hardware.manual.connection')}</FieldLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger id="hw-connection" className="w-full" onBlur={field.onBlur}>
                    <SelectValue placeholder="–" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTIONS.map((connection) => (
                      <SelectItem key={connection} value={connection}>
                        {t(`hardware.manual.connections.${connection}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          {textField('downloadMbps', { numeric: true })}
          {textField('uploadMbps', { numeric: true })}
        </div>
        <FieldDescription>{t('hardware.manual.uploadHint')}</FieldDescription>
        <div className="flex items-center gap-3">
          <SubmitButton isSubmitting={isSavingManual} label={t('hardware.manual.save')} />
          {manualSaved && (
            <span className="flex items-center gap-1 text-xs text-emerald-500" role="status">
              <CheckIcon className="size-3.5" aria-hidden />
              {t('hardware.manual.saved')}
            </span>
          )}
        </div>
      </form>

      <p className="text-muted-foreground text-xs">{t('hardware.limits')}</p>
    </div>
  )
}

export { HardwareSectionView }
export type { HardwareSectionViewProps }
