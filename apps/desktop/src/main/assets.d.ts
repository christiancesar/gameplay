// Vite inlines an image imported with `?inline` as a data URL.
declare module '*.png?inline' {
  const dataUrl: string
  export default dataUrl
}
