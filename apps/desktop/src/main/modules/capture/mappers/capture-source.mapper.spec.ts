import { describe, expect, it } from 'vitest'

import { toCaptureSource } from './capture-source.mapper'

function image(empty = false, jpeg = 'jpeg-bytes', url = 'data:image/png;base64,ICON') {
  return { isEmpty: () => empty, toJPEG: () => Buffer.from(jpeg), toDataURL: () => url }
}

describe('toCaptureSource', () => {
  it('makes a window with a JPEG preview and the icon as a data URL', () => {
    const source = toCaptureSource({ id: 'window:7:0', name: 'Game', thumbnail: image(), appIcon: image() })

    expect(source).toEqual({
      id: 'window:7:0',
      name: 'Game',
      kind: 'window',
      thumbnail: `data:image/jpeg;base64,${Buffer.from('jpeg-bytes').toString('base64')}`,
      appIcon: 'data:image/png;base64,ICON',
    })
  })

  it('takes a source whose id starts with screen: as a screen, with no icon', () => {
    const source = toCaptureSource({ id: 'screen:0:0', name: 'Entire screen', thumbnail: image(), appIcon: null })

    expect(source.kind).toBe('screen')
    expect(source.appIcon).toBeNull()
  })

  it('leaves out an empty preview and an empty icon', () => {
    const source = toCaptureSource({ id: 'window:7:0', name: 'x', thumbnail: image(true), appIcon: image(true) })

    expect(source.thumbnail).toBeNull()
    expect(source.appIcon).toBeNull()
  })

  it('drops an image the bridge would refuse, and keeps the rest of the source', () => {
    const huge = 'data:image/png;base64,' + 'A'.repeat(200_000)

    const source = toCaptureSource({ id: 'window:7:0', name: 'x', thumbnail: image(), appIcon: image(false, '', huge) })

    expect(source.appIcon).toBeNull()
    expect(source.thumbnail).not.toBeNull()
  })
})
