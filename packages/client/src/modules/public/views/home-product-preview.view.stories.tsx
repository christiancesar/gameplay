import type { Meta, StoryObj } from '@storybook/react-vite'

import { HomeProductPreview } from './home-product-preview.view'

const meta = {
  title: 'Public/HomeProductPreview',
  component: HomeProductPreview,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HomeProductPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Portuguese: Story = { globals: { locale: 'pt' } }
