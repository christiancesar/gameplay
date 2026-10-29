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
const tools = [
  { key: 'diagnostics_status', description: 'Returns the effective local desktop diagnostics configuration.' },
  { key: 'diagnostics_recent_events', description: 'Returns the bounded, sanitized local diagnostics history.' },
  {
    key: 'diagnostics_summary',
    description: 'Returns counts of recent diagnostic event names without session content.',
  },
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
  render: () => (
    <McpTabView state="inactive" tools={tools} clients={[]} documentation={docs} onStart={fn()} onStop={fn()} />
  ),
}

export const McpStarting: Story = {
  render: () => (
    <McpTabView state="starting" tools={tools} clients={[]} documentation={docs} onStart={fn()} onStop={fn()} />
  ),
}

export const McpActive: Story = {
  render: () => (
    <McpTabView
      state="active"
      endpoint="http://127.0.0.1:43121/mcp"
      token="mcp-demo-token"
      configuration={'{"url":"http://127.0.0.1:43121/mcp"}'}
      tools={tools}
      clients={[
        {
          name: 'Claude Desktop',
          version: '1.0.0',
          connectedAt: '2026-10-29T22:00:00.000Z',
          lastSeenAt: '2026-10-29T22:05:00.000Z',
        },
      ]}
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
