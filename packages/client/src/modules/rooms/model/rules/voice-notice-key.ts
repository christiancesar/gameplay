import type { VoiceNotice } from '../entities/voice-state'

const KEYS = {
  'other-tab': 'voice.notice.otherTab',
  'room-deleted': 'voice.notice.roomDeleted',
  'join-failed': 'voice.notice.joinFailed',
  'reconnect-failed': 'voice.notice.reconnectFailed',
} as const satisfies Record<VoiceNotice, string>

/** i18n key of the toast that explains why the call ended. */
function voiceNoticeKey(notice: VoiceNotice) {
  return KEYS[notice]
}

export { voiceNoticeKey }
