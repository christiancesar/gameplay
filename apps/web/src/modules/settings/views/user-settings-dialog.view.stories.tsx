import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, screen, waitFor, within } from 'storybook/test'

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
  usernameTaken: boolean
  wrongPassword: boolean
  passwordChanged: boolean
  autoLanguage: boolean
}

const onSignOut = fn()
const onToggleTest = fn()
const onAllowDisplays = fn()
const onSaveManual = fn()
const onSaveUsername = fn()
const onChangePassword = fn()
const lastSentAt = new Date(Date.now() - 5 * 60_000).toISOString()

function Scenario({
  initialSection,
  permission,
  isTesting,
  avatarError,
  noAvatar,
  weakDevice,
  displaysPermission,
  usernameTaken,
  wrongPassword,
  passwordChanged,
  autoLanguage,
}: ScenarioProps) {
  const [section, setSection] = useState(initialSection)
  const language = useStoryLanguage()
  const [languagePreference, setLanguagePreference] = useState(autoLanguage ? null : language.language)
  const theme = useStoryTheme()

  const content = {
    profile: (
      <ProfileSectionView
        user={noAvatar ? { ...me, avatarUrl: undefined } : me}
        isUploadingAvatar={false}
        avatarError={avatarError ? 'invalidType' : undefined}
        onSelectAvatar={fn()}
        onRemoveAvatar={fn()}
        isSavingUsername={false}
        usernameError={usernameTaken ? 'usernameTaken' : undefined}
        onSaveUsername={onSaveUsername}
        isChangingPassword={false}
        passwordError={wrongPassword ? 'invalidPassword' : undefined}
        passwordChanged={passwordChanged}
        onChangePassword={onChangePassword}
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
        language={languagePreference}
        languageOptions={languageOptions}
        onThemeChange={(next) => next !== theme.theme && theme.onToggleTheme()}
        onLanguageChange={(next) => {
          setLanguagePreference(next)
          if (next) language.onLanguageChange(next)
        }}
      />
    ),
    hardware: (
      <HardwareSectionView
        hardware={
          weakDevice
            ? oldNotebook
            : displaysPermission === 'granted'
              ? gamingPc
              : { ...gamingPc, displays: gamingPc.displays.slice(0, 1) }
        }
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
  args: {
    initialSection: 'profile',
    permission: 'granted',
    isTesting: false,
    avatarError: false,
    noAvatar: false,
    weakDevice: false,
    displaysPermission: 'granted',
    usernameTaken: false,
    wrongPassword: false,
    passwordChanged: false,
    autoLanguage: false,
  },
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

/** Salvar só libera depois de mudar; o formato é checado antes de chegar ao servidor. */
export const EditUsername: Story = {
  play: async ({ userEvent }) => {
    const input = await screen.findByLabelText(/^username$/i)
    const save = screen.getByRole('button', { name: /^save$/i })
    await expect(save).toBeDisabled()
    await userEvent.clear(input)
    await userEvent.type(input, 'shini game')
    await userEvent.click(save)
    await expect(await screen.findByRole('alert')).toHaveTextContent(/3 to 32 letters/i)
    await expect(onSaveUsername).not.toHaveBeenCalled()

    await userEvent.clear(input)
    await userEvent.type(input, 'Shini.Game')
    await userEvent.click(save)
    await expect(onSaveUsername).toHaveBeenCalledWith('Shini.Game')
  },
}

export const UsernameTaken: Story = { args: { usernameTaken: true } }

/** Nova senha com no mínimo 8 caracteres e confirmada; a atual vai junto para o servidor conferir. */
export const ChangePassword: Story = {
  play: async ({ userEvent }) => {
    await userEvent.type(await screen.findByLabelText(/current password/i), 'hunter2222')
    await userEvent.type(screen.getByLabelText(/^new password/i), 'short')
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'other')
    await userEvent.click(screen.getByRole('button', { name: /change password/i }))
    await expect(await screen.findByText(/at least 8 characters/i)).toBeVisible()
    await expect(screen.getByText(/don't match/i)).toBeVisible()
    await expect(onChangePassword).not.toHaveBeenCalled()

    await userEvent.clear(screen.getByLabelText(/^new password/i))
    await userEvent.type(screen.getByLabelText(/^new password/i), 'correct-horse')
    await userEvent.clear(screen.getByLabelText(/confirm new password/i))
    await userEvent.type(screen.getByLabelText(/confirm new password/i), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: /change password/i }))
    await expect(onChangePassword).toHaveBeenCalledWith({ currentPassword: 'hunter2222', newPassword: 'correct-horse' })
  },
}

export const ChangePasswordWrongCurrent: Story = { args: { wrongPassword: true } }
export const PasswordChanged: Story = { args: { passwordChanged: true } }

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

/** "Auto" guarda null: o app segue o idioma do navegador. */
export const AppearanceAutoLanguage: Story = {
  args: { initialSection: 'appearance', autoLanguage: true },
  play: async ({ userEvent }) => {
    const auto = await screen.findByRole('radio', { name: /auto/i })
    await expect(auto).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: 'EN' }))
    await expect(auto).toHaveAttribute('aria-checked', 'false')
  },
}

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
    await waitFor(() => expect(screen.getByText(/greater than zero/i)).toBeVisible())
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
export const HardwareWeakDevice: Story = {
  args: { initialSection: 'hardware', weakDevice: true, displaysPermission: 'denied' },
}

export const Account: Story = {
  args: { initialSection: 'account' },
  play: async ({ userEvent }) => {
    await userEvent.click(await screen.findByRole('button', { name: /sign out/i }))
    const confirm = await screen.findByRole('alertdialog')
    await expect(onSignOut).not.toHaveBeenCalled()
    await userEvent.click(within(confirm).getByRole('button', { name: /sign out/i }))
    await waitFor(() => expect(onSignOut).toHaveBeenCalledOnce())
  },
}
