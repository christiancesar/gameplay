import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen } from 'storybook/test'

import type { DiagnosticsStatus } from '@gameplay/contracts'

import { DevelopmentTabView } from './development-tab.view'
import { McpTabView } from './mcp-tab.view'

const statusOff: DiagnosticsStatus = { diagnostics: false, cdpPort: null, mainInspectPort: null, devtools: false }
const statusActive: DiagnosticsStatus = { diagnostics: true, cdpPort: 9223, mainInspectPort: 9229, devtools: true }
const docs = [
  'Only the local desktop process can activate these resources.',
  'The panel does not open ports through the server.',
]

const meta = {
  title: 'Admin/Diagnostics',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const DevelopmentOff: Story = {
  render: () => <DevelopmentTabView status={statusOff} documentation={docs} />,
}

export const DevelopmentActive: Story = {
  render: () => <DevelopmentTabView status={statusActive} documentation={docs} />,
}

export const McpOff: Story = {
  render: () => <McpTabView state="inactive" documentation={docs} onStart={fn()} onStop={fn()} />,
}

export const McpStarting: Story = {
  render: () => <McpTabView state="starting" documentation={docs} onStart={fn()} onStop={fn()} />,
}

export const McpActive: Story = {
  render: () => (
    <McpTabView
      state="active"
      endpoint="http://127.0.0.1:43121/mcp"
      token="mcp-demo-token"
      configuration={'{"url":"http://127.0.0.1:43121/mcp"}'}
      documentation={docs}
      onStart={fn()}
      onStop={fn()}
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /stop server/i }))
    await expect(screen.getByRole('alertdialog')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /stop server/i }))
  },
}
