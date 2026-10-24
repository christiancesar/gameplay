import { MicIcon, SquareIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Progress } from '@/shared/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

type AudioDevice = { id: string; label: string }

type AudioSectionViewProps = {
  permission: 'granted' | 'prompt' | 'denied'
  microphones: readonly AudioDevice[]
  outputs: readonly AudioDevice[]
  microphoneId: string
  outputId: string
  isTesting: boolean
  /** Nível do microfone em teste, de 0 a 1. */
  inputLevel: number
  onMicrophoneChange: (deviceId: string) => void
  onOutputChange: (deviceId: string) => void
  onToggleTest: () => void
  onRequestPermission: () => void
}

function AudioSectionView({
  permission,
  microphones,
  outputs,
  microphoneId,
  outputId,
  isTesting,
  inputLevel,
  onMicrophoneChange,
  onOutputChange,
  onToggleTest,
  onRequestPermission,
}: AudioSectionViewProps) {
  const { t } = useTranslation()
  const locked = permission !== 'granted'

  return (
    <FieldGroup>
      {locked && (
        <Alert>
          <MicIcon />
          <AlertDescription className="flex flex-col items-start gap-3">
            {permission === 'denied' ? t('voice.micDeniedDescription') : t('settings.audio.permissionNeeded')}
            {permission === 'prompt' && (
              <Button size="sm" onClick={onRequestPermission}>
                {t('settings.audio.allow')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      <DeviceSelect
        id="audio-microphone"
        label={t('settings.audio.microphone')}
        devices={microphones}
        value={microphoneId}
        disabled={locked}
        onChange={onMicrophoneChange}
      />
      <DeviceSelect
        id="audio-output"
        label={t('settings.audio.output')}
        devices={outputs}
        value={outputId}
        disabled={locked}
        onChange={onOutputChange}
      />
      <Field>
        <FieldLabel htmlFor="audio-level">{t('settings.audio.level')}</FieldLabel>
        <div className="flex items-center gap-3">
          <Progress
            id="audio-level"
            value={isTesting ? Math.round(inputLevel * 100) : 0}
            className="h-2 flex-1"
            aria-label={t('settings.audio.level')}
          />
          <Button variant="outline" size="sm" disabled={locked} onClick={onToggleTest}>
            {isTesting ? <SquareIcon data-icon="inline-start" /> : <MicIcon data-icon="inline-start" />}
            {isTesting ? t('settings.audio.stopTest') : t('settings.audio.testMic')}
          </Button>
        </div>
        {isTesting && <FieldDescription>{t('settings.audio.testHint')}</FieldDescription>}
      </Field>
    </FieldGroup>
  )
}

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

export { AudioSectionView }
export type { AudioDevice, AudioSectionViewProps }
