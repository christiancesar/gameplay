// Makes the icon of every platform from the one master, brand/icons/source.png. Run: npm run icons -w @gameplay/client
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import icongen from 'icon-gen'
import sharp from 'sharp'

const brand = path.resolve(import.meta.dirname, '../src/shared/assets/brand/icons')
const source = path.join(brand, 'source.png')

async function png(directory, name, size) {
  await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(directory, name))
}

async function folder(name) {
  const directory = path.join(brand, name)
  await mkdir(directory, { recursive: true })
  return directory
}

// Web: the tab icon (ico with its small sizes), the PNG for high-density tabs and the iOS home screen.
const web = await folder('web')
await icongen(source, web, { report: false, ico: { name: 'favicon', sizes: [16, 32, 48] } })
await png(web, 'icon-192.png', 192)
await png(web, 'apple-touch-icon.png', 180)

// Windows: the .ico of the executable and installer (every size Explorer asks for) and a PNG for the window.
const windows = await folder('windows')
await icongen(source, windows, { report: false, ico: { name: 'icon', sizes: [16, 24, 32, 48, 64, 128, 256] } })
await png(windows, 'icon.png', 256)

// macOS: the .icns of the app bundle and a PNG for the Dock while it runs unpackaged.
const macos = await folder('macos')
await icongen(source, macos, { report: false, icns: { name: 'icon', sizes: [16, 32, 64, 128, 256, 512] } })
await png(macos, 'icon.png', 512)

// Linux: one PNG for the window and the package.
await png(await folder('linux'), 'icon.png', 512)
