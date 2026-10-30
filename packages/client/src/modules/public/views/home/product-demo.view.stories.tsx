import type { Meta, StoryObj } from '@storybook/react-vite'

import { ProductDemoView } from './product-demo.view'

const meta = {
  title: 'Public/Home/ProductDemo',
  component: ProductDemoView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProductDemoView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Portuguese: Story = { globals: { locale: 'pt' } }
