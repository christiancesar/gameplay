import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor } from 'storybook/test'

import { me } from '@/fixtures'
import { gamingPc, oldNotebook } from '@/fixtures/hardware'
import { languageOptions, useStoryLanguage } from '@/fixtures/language'
import { useStoryTheme } from '@/fixtures/theme'

import { AccountSectionView } from './account-section.view'
import { AppearanceSectionView } from './appearance-section.view'
import { AudioSectionView, type AudioSectionViewProps } from './audio-section.view'
import { HardwareSectionView } from './hardware-section.view'
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
  weakDevice: boolean
  displaysPermission: 'granted' | 'prompt' | 'denied'
}

const onSignOut = fn()
const onToggleTest = fn()
const onAllowDisplays = fn()
const onSaveManual = fn()
const lastSentAt = new Date(Date.now() - 5 * 60_000).toISOString()

function Scenario({ initialSection, permission, isTesting, avatarError, noAvatar, weakDevice, displaysPermission }: ScenarioProps) {
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
    hardware: (
      <HardwareSectionView
        hardware={weakDevice ? oldNotebook : displaysPermission === 'granted' ? gamingPc : { ...gamingPc, displays: gamingPc.displays.slice(0, 1) }}
        displaysPermission={displaysPermission}
        lastSentAt={lastSentAt}
        isCollecting={false}
        isSavingManual={false}
        manualSaved={false}
        onRefresh={fn()}
        onAllowDisplays={onAllowDisplays}
        onSaveManual={onSaveManual}
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
  args: { initialSection: 'profile', permission: 'granted', isTesting: false, avatarError: false, noAvatar: false, weakDevice: false, displaysPermission: 'granted' },
  argTypes: {
    initialSection: { control: 'select', options: ['profile', 'audio', 'appearance', 'hardware', 'account'] },
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

export const Hardware: Story = { args: { initialSection: 'hardware' } }

export const HardwareMonitorsPermission: Story = {
  args: { initialSection: 'hardware', displaysPermission: 'prompt' },
  play: async ({ userEvent }) => {
    await userEvent.click(await screen.findByRole('button', { name: /^allow$/i }))
    await expect(onAllowDisplays).toHaveBeenCalledOnce()
  },
}

export const HardwareCompleteManually: Story = {
  args: { initialSection: 'hardware' },
  play: async ({ userEvent }) => {
    await userEvent.type(await screen.findByLabelText(/processor model/i), 'AMD Ryzen 7 5800X')
    await userEvent.type(screen.getByLabelText(/^ram/i), 'muito')
    await userEvent.type(screen.getByLabelText(/^upload/i), '50,5')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await expect(await screen.findByText(/greater than zero/i)).toBeVisible()
    await expect(onSaveManual).not.toHaveBeenCalled()

    await userEvent.clear(screen.getByLabelText(/^ram/i))
    await userEvent.type(screen.getByLabelText(/^ram/i), '32')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))
    // Texto vira número (vírgula aceita) e campos vazios saem como undefined.
    await expect(onSaveManual).toHaveBeenCalledWith(
      {
        cpuModel: 'AMD Ryzen 7 5800X',
        ramGb: 32,
        gpuModel: undefined,
        vramGb: undefined,
        connection: undefined,
        downloadMbps: undefined,
        uploadMbps: 50.5,
      },
      expect.anything(),
    )
  },
}

/** Notebook sem aceleração gráfica e sem codificação por hardware. */
export const HardwareWeakDevice: Story = { args: { initialSection: 'hardware', weakDevice: true, displaysPermission: 'denied' } }

export const Account: Story = {
  args: { initialSection: 'account' },
  play: async ({ userEvent }) => {
    await userEvent.click(await screen.findByRole('button', { name: /sign out/i }))
    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce())
  },
}
