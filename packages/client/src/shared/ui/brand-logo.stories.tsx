import type { Meta, StoryObj } from '@storybook/react-vite'

import { BrandLogo } from './brand-logo'

const meta = {
  title: 'Shared/UI/BrandLogo',
  component: BrandLogo,
  args: { className: 'w-48' },
} satisfies Meta<typeof BrandLogo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Unlimited: Story = { args: { variant: 'unlimited' } }
