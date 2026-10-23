import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { BrandLogo } from '@/shared/ui/brand-logo'
import { LanguageSwitcher, type LanguageOption } from '@/shared/ui/language-switcher'

type AuthLayoutViewProps = {
  children: ReactNode
  language: string
  languageOptions: readonly LanguageOption[]
  onLanguageChange: (language: string) => void
}

function AuthLayoutView({ children, language, languageOptions, onLanguageChange }: AuthLayoutViewProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <BrandLogo className="w-36" />
      <div className="w-full max-w-sm">{children}</div>
      <LanguageSwitcher
        value={language}
        options={languageOptions}
        onChange={onLanguageChange}
        ariaLabel={t('common.language')}
      />
    </div>
  )
}

export { AuthLayoutView }
export type { AuthLayoutViewProps }
