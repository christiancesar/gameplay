import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { me } from '@/fixtures'
import { languageOptions, useStoryLanguage } from '@/fixtures/language'
import { useStoryTheme } from '@/fixtures/theme'

import { AccountSectionView } from './account-section.view'
import { AppearanceSectionView } from './appearance-section.view'
import { AudioSectionView, type AudioSectionViewProps } from './audio-section.view'
import { ProfileSectionView } from './profile-section.view'
import { UserSettingsDialogView, type UserSettingsSection } from './user-settings-dialog.view'

const microphones = [
  { id: 'mic-1', label: 'HyperX Cloud II Microphone' },
  { id: 'mic-2', label: 'Webcam C920 Microphone' },
]
const outputs = [
  { id: 'out-1', label: 'HyperX Cloud II' },
  { id: 'out-2', label: 'Monitor speakers (HDMI)' },
]

type ScenarioProps = {
  initialSection: UserSettingsSection
  permission: AudioSectionViewProps['permission']
  isTesting: boolean
  avatarError: boolean
  noAvatar: boolean
}

const onSignOut = fn()
const onToggleTest = fn()

function Scenario({ initialSection, permission, isTesting, avatarError, noAvatar }: ScenarioProps) {
  const [section, setSection] = useState(initialSection)
  const language = useStoryLanguage()
  const theme = useStoryTheme()

  const content = {
    profile: (
      <ProfileSectionView
        user={noAvatar ? { ...me, avatarUrl: undefined } : me}
        isUploadingAvatar={false}
        avatarError={avatarError ? 'invalidType' : undefined}
        onSelectAvatar={fn()}
        onRemoveAvatar={fn()}
      />
    ),
    audio: (
      <AudioSectionView
        permission={permission}
        microphones={permission === 'granted' ? microphones : []}
        outputs={permission === 'granted' ? outputs : []}
        microphoneId="mic-1"
        outputId="default"
        isTesting={isTesting}
        inputLevel={0.62}
        onMicrophoneChange={fn()}
        onOutputChange={fn()}
        onToggleTest={onToggleTest}
        onRequestPermission={fn()}
      />
    ),
    appearance: (
      <AppearanceSectionView
        theme={theme.theme}
        language={language.language}
        languageOptions={languageOptions}
        onThemeChange={(next) => next !== theme.theme && theme.onToggleTheme()}
        onLanguageChange={language.onLanguageChange}
      />
    ),
    account: <AccountSectionView isSigningOut={false} onSignOut={onSignOut} />,
  }[section]

  return (
    <UserSettingsDialogView open userName={me.name} section={section} onOpenChange={fn()} onSectionChange={setSection}>
      {content}
    </UserSettingsDialogView>
  )
}

const meta = {
  title: 'Settings/UserSettings',
  component: Scenario,
  args: { initialSection: 'profile', permission: 'granted', isTesting: false, avatarError: false, noAvatar: false },
  argTypes: {
    initialSection: { control: 'select', options: ['profile', 'audio', 'appearance', 'account'] },
    permission: { control: 'inline-radio', options: ['granted', 'prompt', 'denied'] },
  },
} satisfies Meta<typeof Scenario>

export default meta
type Story = StoryObj<typeof meta>

export const Profile: Story = {}
export const ProfileNoAvatar: Story = { args: { noAvatar: true } }
export const ProfileAvatarError: Story = { args: { avatarError: true } }

export const Audio: Story = { args: { initialSection: 'audio' } }
export const AudioTestingMicrophone: Story = {
  args: { initialSection: 'audio', isTesting: true },
  play: async ({ userEvent }) => {
    await userEvent.click(await screen.findByRole('button', { name: /stop test/i }))
    await expect(onToggleTest).toHaveBeenCalledOnce()
  },
}
export const AudioPermissionNeeded: Story = { args: { initialSection: 'audio', permission: 'prompt' } }
export const AudioPermissionDenied: Story = { args: { initialSection: 'audio', permission: 'denied' } }

export const Appearance: Story = { args: { initialSection: 'appearance' } }

export const Account: Story = {
  args: { initialSection: 'account' },
  play: async ({ userEvent }) => {
    await userEvent.click(await screen.findByRole('button', { name: /sign out/i }))
    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce())
  },
}
