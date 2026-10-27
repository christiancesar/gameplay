type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

type NoticeKey = 'vpn' | 'acceleration' | 'monitors'

type DismissedNotices = {
  isDismissed: (key: NoticeKey) => boolean
  dismiss: (key: NoticeKey) => void
}

const PREFIX = 'gameplay:dismissed-notice:'

/** Remembers dismissed notices for the tab session. Storage can be blocked, so it never throws. */
function createDismissedNotices(getStorage: () => StorageLike): DismissedNotices {
  return {
    isDismissed(key) {
      try {
        return getStorage().getItem(PREFIX + key) === '1'
      } catch {
        return false
      }
    },
    dismiss(key) {
      try {
        getStorage().setItem(PREFIX + key, '1')
      } catch {
        // Not remembered; the notice may come back on reload.
      }
    },
  }
}

const dismissedNotices = createDismissedNotices(() => sessionStorage)

export { createDismissedNotices, dismissedNotices }
export type { DismissedNotices, NoticeKey, StorageLike }
