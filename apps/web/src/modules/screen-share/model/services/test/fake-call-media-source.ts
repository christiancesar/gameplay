import type { CallMedia } from '@/shared/media/call-media'

/** Stands in for the voice call: specs open and close the media and the sessions follow. */
class FakeCallMediaSource {
  current: CallMedia | null = null
  private readonly handlers = new Set<(media: CallMedia | null) => void>()

  readonly subscribe = (handler: (media: CallMedia | null) => void) => {
    this.handlers.add(handler)
    handler(this.current)
    return () => this.handlers.delete(handler)
  }

  emit(media: CallMedia | null) {
    this.current = media
    for (const handler of [...this.handlers]) handler(media)
  }

  get listenerCount() {
    return this.handlers.size
  }
}

export { FakeCallMediaSource }
