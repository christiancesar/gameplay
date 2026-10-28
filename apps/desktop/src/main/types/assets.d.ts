// Vite inlines an image imported with `?inline` as a data URL.
declare module '*.png?inline' {
  const dataUrl: string
  export default dataUrl
}

// The package ships no types: it is true when the app was started by the Windows installer for a Squirrel event.
declare module 'electron-squirrel-startup' {
  const squirrelStartup: boolean
  export default squirrelStartup
}
