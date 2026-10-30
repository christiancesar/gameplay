import type { Meta, StoryObj } from '@storybook/react-vite'

import { HomeProductDemo } from './home-product-demo.view'

const meta = {
  title: 'Public/HomeProductDemo',
  component: HomeProductDemo,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HomeProductDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Portuguese: Story = { globals: { locale: 'pt' } }
