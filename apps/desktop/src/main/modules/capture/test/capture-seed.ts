import type { CaptureSource } from '@gameplay/desktop-bridge'

const thumbnail = 'data:image/jpeg;base64,AAAA'

export const screenSource: CaptureSource = {
  id: 'screen:0:0',
  name: 'Entire screen',
  kind: 'screen',
  thumbnail,
  appIcon: null,
}
export const gameSource: CaptureSource = {
  id: 'window:590528:0',
  name: 'Game',
  kind: 'window',
  thumbnail,
  appIcon: 'data:image/png;base64,BBBB',
}
export const browserSource: CaptureSource = {
  id: 'window:262794:0',
  name: 'browser',
  kind: 'window',
  thumbnail,
  appIcon: null,
}
export const untitledSource: CaptureSource = {
  id: 'window:99:0',
  name: '  ',
  kind: 'window',
  thumbnail,
  appIcon: null,
}
