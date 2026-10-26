export type BrowserSupportStatus =
  | { type: 'unsupported'; browser: { name: string; version: string } }
  | { type: 'outdated'; browser: { name: string; version: string }; minVersion: number }
