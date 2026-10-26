import { AudioSectionView } from '@/modules/settings/views/audio-section.view'
import { useAudioSettingsViewModel } from '@/modules/settings/view-models/use-audio-settings.view-model'

export function AudioSectionScreen() {
  return <AudioSectionView {...useAudioSettingsViewModel()} />
}
