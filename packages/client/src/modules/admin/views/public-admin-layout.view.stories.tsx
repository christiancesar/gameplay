import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { PublicAdminLayoutView } from './public-admin-layout.view'

const meta = {
  title: 'Admin/Public/Layout',
  component: PublicAdminLayoutView,
  args: { tab: 'roadmap', children: <div className="p-4">Content</div>, onTabChange: fn() },
} satisfies Meta<typeof PublicAdminLayoutView>

export default meta
type Story = StoryObj<typeof meta>

export const Roadmap: Story = {}
export const FeatureRequests: Story = { args: { tab: 'feature-requests' } }
export const Portuguese: Story = { globals: { locale: 'pt' } }
