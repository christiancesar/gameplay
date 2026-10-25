import { useRecoveryCodeViewModel } from '@/modules/auth/view-models/use-recovery-code.view-model'
import { useLanguageViewModel } from '@/modules/settings/view-models/use-language.view-model'
import { RecoveryCodeView } from '@/modules/auth/views/recovery-code.view'

export function RecoveryCodeScreen() {
  const viewModel = useRecoveryCodeViewModel()
  const { language, languageOptions, setLanguage } = useLanguageViewModel()

  return (
    <RecoveryCodeView
      {...viewModel}
      language={language}
      languageOptions={languageOptions}
      onLanguageChange={setLanguage}
    />
  )
}
