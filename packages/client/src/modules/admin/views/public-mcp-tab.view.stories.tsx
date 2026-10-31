import type { Meta, StoryObj } from '@storybook/react-vite'

import { PublicMcpTabView } from './public-mcp-tab.view'

const meta = { title: 'Admin/Public/MCP', component: PublicMcpTabView } satisfies Meta<typeof PublicMcpTabView>

export default meta
type Story = StoryObj<typeof meta>

export const Planned: Story = {}
export const Portuguese: Story = { globals: { locale: 'pt' } }
