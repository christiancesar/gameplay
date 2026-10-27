import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview, ReactRenderer } from '@storybook/react-vite'
import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'

import { i18n, SUPPORTED_LANGUAGES } from '../src/shared/i18n'
import { PlatformProvider } from '../src/shared/platform/platform-provider'
import { FakePlatform } from '../src/shared/platform/test/fake-platform'
import { TooltipProvider } from '../src/shared/ui/tooltip'
import '../src/styles/theme.css'

// A browser that captures nothing: Views get their data by props, the platform is only there for what reads it.
const platform = new FakePlatform()

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    locale: {
      description: 'Idioma',
      toolbar: {
        icon: 'globe',
        items: SUPPORTED_LANGUAGES.map((lng) => ({ value: lng, title: lng.toUpperCase() })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: 'en',
    theme: 'dark',
  },
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'dark',
    }),
    (Story, context) => {
      const locale = context.globals.locale as string
      useEffect(() => {
        void i18n.changeLanguage(locale)
      }, [locale])
      return (
        <I18nextProvider i18n={i18n}>
          <PlatformProvider platform={platform}>
            <TooltipProvider>
              <div
                className={
                  context.parameters.layout === 'fullscreen'
                    ? 'bg-background text-foreground'
                    : 'bg-background text-foreground min-h-full p-4'
                }
              >
                <Story />
              </div>
            </TooltipProvider>
          </PlatformProvider>
        </I18nextProvider>
      )
    },
  ],
}

export default preview
