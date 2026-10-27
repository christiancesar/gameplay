import type { MediaResource, ServerMediaOverrides } from '@gameplay/contracts'

import type { MediaChoice } from '@/modules/admin/model/media-choice.schema'

type MediaChoices = Record<MediaResource, MediaChoice>

/** API override (null = global) to the choice the dialog shows. */
function toMediaChoices(overrides: ServerMediaOverrides): MediaChoices {
  const choice = (value: boolean | null): MediaChoice => (value === null ? 'global' : value ? 'on' : 'off')
  return { sfu: choice(overrides.sfu), mesh: choice(overrides.mesh), turn: choice(overrides.turn) }
}

function fromMediaChoices(choices: MediaChoices): ServerMediaOverrides {
  const value = (choice: MediaChoice) => (choice === 'global' ? null : choice === 'on')
  return { sfu: value(choices.sfu), mesh: value(choices.mesh), turn: value(choices.turn) }
}

export { fromMediaChoices, toMediaChoices }
export type { MediaChoices }
