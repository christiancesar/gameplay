import { CheckIcon, RefreshCwIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { DeviceHardwareView, type DeviceHardware, type DisplaysPermission } from '@/modules/hardware/views/device-hardware.view'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { formatRelativeTime } from '@/shared/ui/relative-time'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SubmitButton } from '@/shared/ui/submit-button'

type ManualHardwareField = 'cpuModel' | 'ramGb' | 'gpuModel' | 'vramGb' | 'connection' | 'downloadMbps' | 'uploadMbps'

type HardwareSectionViewProps = {
  hardware: DeviceHardware
  displaysPermission: DisplaysPermission
  lastSentAt?: string
  isCollecting: boolean
  /** Valores do formulário de complemento, como texto (o ViewModel converte e valida). */
  manual: Record<ManualHardwareField, string>
  isSavingManual: boolean
  manualSaved: boolean
  onRefresh: () => void
  onAllowDisplays: () => void
  onManualChange: (field: ManualHardwareField, value: string) => void
  onSaveManual: () => void
}

const CONNECTIONS = ['ethernet', 'wifi', 'mobile'] as const

function HardwareSectionView({
  hardware,
  displaysPermission,
  lastSentAt,
  isCollecting,
  manual,
  isSavingManual,
  manualSaved,
  onRefresh,
  onAllowDisplays,
  onManualChange,
  onSaveManual,
}: HardwareSectionViewProps) {
  const { t, i18n } = useTranslation()

  const textField = (field: ManualHardwareField, props: { placeholder?: string; numeric?: boolean } = {}) => (
    <Field>
      <FieldLabel htmlFor={`hw-${field}`}>{t(`hardware.manual.${field}`)}</FieldLabel>
      <Input
        id={`hw-${field}`}
        inputMode={props.numeric ? 'decimal' : undefined}
        placeholder={props.placeholder}
        value={manual[field]}
        onChange={(event) => onManualChange(field, event.target.value)}
      />
    </Field>
  )

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
        onSubmit={(event) => {
          event.preventDefault()
          onSaveManual()
        }}
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
          <Field>
            <FieldLabel htmlFor="hw-connection">{t('hardware.manual.connection')}</FieldLabel>
            <Select value={manual.connection || undefined} onValueChange={(value) => onManualChange('connection', value)}>
              <SelectTrigger id="hw-connection" className="w-full">
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
export type { HardwareSectionViewProps, ManualHardwareField }
