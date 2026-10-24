import { MoonIcon, SunIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Field, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { LanguageSwitcher, type LanguageOption } from '@/shared/ui/language-switcher'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'

type AppearanceSectionViewProps = {
  theme: 'dark' | 'light'
  language: string
  languageOptions: readonly LanguageOption[]
  onThemeChange: (theme: 'dark' | 'light') => void
  onLanguageChange: (language: string) => void
}

function AppearanceSectionView({
  theme,
  language,
  languageOptions,
  onThemeChange,
  onLanguageChange,
}: AppearanceSectionViewProps) {
  const { t } = useTranslation()

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{t('settings.appearance.theme')}</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={theme}
          onValueChange={(next) => next && onThemeChange(next as 'dark' | 'light')}
          aria-label={t('settings.appearance.theme')}
          className="w-fit"
        >
          <ToggleGroupItem value="dark" className="px-4">
            <MoonIcon aria-hidden />
            {t('settings.appearance.dark')}
          </ToggleGroupItem>
          <ToggleGroupItem value="light" className="px-4">
            <SunIcon aria-hidden />
            {t('settings.appearance.light')}
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>
      <Field>
        <FieldLabel>{t('settings.appearance.language')}</FieldLabel>
        <LanguageSwitcher
          className="w-fit"
          value={language}
          options={languageOptions}
          onChange={onLanguageChange}
          ariaLabel={t('settings.appearance.language')}
        />
      </Field>
    </FieldGroup>
  )
}

export { AppearanceSectionView }
export type { AppearanceSectionViewProps }
