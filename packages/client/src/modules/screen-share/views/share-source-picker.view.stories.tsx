import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/test'

import { captureSources } from '@/fixtures/capture-sources'

import { ShareSourcePickerView } from './share-source-picker.view'

const meta = {
  title: 'ScreenShare/ShareSourcePicker',
  component: ShareSourcePickerView,
  args: {
    sources: captureSources,
    kind: 'screen',
    selectedId: 'screen:0:0',
    onSelect: fn(),
    onRefresh: fn(),
  },
  render: function Render(args) {
    const [selectedId, setSelectedId] = useState(args.selectedId)
    return (
      <div className="w-[32rem]">
        <ShareSourcePickerView
          {...args}
          selectedId={selectedId}
          onSelect={(id) => {
            args.onSelect(id)
            setSelectedId(id)
          }}
        />
      </div>
    )
  },
} satisfies Meta<typeof ShareSourcePickerView>

export default meta
type Story = StoryObj<typeof meta>

/** The screen section only lists screens. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'Entire screen' })).toBeChecked()
    await expect(canvas.getAllByRole('radio')).toHaveLength(2)
  },
}

export const ChooseAWindow: Story = {
  args: { kind: 'window', selectedId: 'window:590528:0' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('radio', { name: 'Cyberpunk 2077' }))
    await expect(args.onSelect).toHaveBeenCalledWith('window:590528:0')
    await expect(canvas.getByRole('radio', { name: 'Cyberpunk 2077' })).toBeChecked()
    await expect(canvas.queryByRole('radio', { name: 'Entire screen' })).toBeNull()
  },
}

export const Refresh: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /refresh/i }))
    await expect(args.onRefresh).toHaveBeenCalledOnce()
  },
}

/** Sem miniatura, o cartão mostra o ícone do tipo. */
export const WithoutPreviews: Story = {
  args: { sources: captureSources.map((source) => ({ ...source, thumbnail: null, appIcon: null })) },
}

export const NothingFound: Story = {
  args: { sources: [], selectedId: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/no source of this type found/i)).toBeVisible()
    await expect(canvas.queryByRole('radio')).toBeNull()
  },
}
