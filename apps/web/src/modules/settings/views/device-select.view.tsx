import { useTranslation } from 'react-i18next'

import { Field, FieldLabel } from '@/shared/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import type { AudioDevice } from './audio-section.view'

function DeviceSelect({
  id,
  label,
  devices,
  value,
  disabled,
  onChange,
}: {
  id: string
  label: string
  devices: readonly AudioDevice[]
  value: string
  disabled: boolean
  onChange: (deviceId: string) => void
}) {
  const { t } = useTranslation()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={t('settings.audio.default')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">{t('settings.audio.default')}</SelectItem>
          {devices.map((device) => (
            <SelectItem key={device.id} value={device.id}>
              {device.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export { DeviceSelect }
