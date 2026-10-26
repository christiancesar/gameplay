import { useHardwareSettingsViewModel } from '@/modules/hardware/view-models/use-hardware-settings.view-model'
import { HardwareSectionView } from '@/modules/settings/views/hardware-section.view'

export function HardwareSectionScreen() {
  const { hardware, ...section } = useHardwareSettingsViewModel()
  // Nothing to show until the first report exists; the ViewModel collects it right away.
  return hardware ? <HardwareSectionView hardware={hardware} {...section} /> : null
}
