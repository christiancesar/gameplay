import { create } from 'zustand'

import { idleWatch, type WatchSnapshot } from '@/modules/screen-share/model/entities/watch'

/** The screen being watched. `WatchSession` writes it; ViewModels only read. */
const useWatchStore = create<WatchSnapshot>()(() => ({ ...idleWatch }))

export { useWatchStore }
