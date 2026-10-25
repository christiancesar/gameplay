import { create } from 'zustand'

import { idleShare, type ShareSnapshot } from '@/modules/screen-share/model/entities/share'

/** The screen share as the UI sees it. `ShareSession` writes it; ViewModels only read. */
const useShareStore = create<ShareSnapshot>()(() => ({ ...idleShare }))

export { useShareStore }
