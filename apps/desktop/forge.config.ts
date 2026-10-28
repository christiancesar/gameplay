import path from 'node:path'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerZIP } from '@electron-forge/maker-zip'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'
import { FuseV1Options, FuseVersion } from '@electron/fuses'

// One master in the client package, one folder per platform (see packages/client: npm run icons).
const icons = path.resolve(import.meta.dirname, '../../packages/client/src/shared/assets/brand/icons')

const config: ForgeConfig = {
  packagerConfig: {
    name: 'gameplay',
    executableName: 'gameplay',
    asar: true,
    // The packager adds the extension of the system it builds for: .ico on Windows, .icns on macOS. Linux has
    // none (the deb maker and the window carry the PNG).
    icon: path.join(icons, process.platform === 'win32' ? 'windows/icon' : 'macos/icon'),
  },
  // Linux only for now; the other systems and the signing come with the packaging ticket.
  makers: [
    new MakerZIP({}, ['linux']),
    new MakerDeb({
      options: {
        name: 'gameplay',
        bin: 'gameplay',
        maintainer: 'Gameplay',
        homepage: 'https://gameplay.oikos.company',
        icon: path.join(icons, 'linux/icon.png'),
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main/main.ts', config: 'vite.main.config.ts', target: 'main' },
        { entry: 'src/preload/preload.ts', config: 'vite.preload.config.ts', target: 'preload' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
    // Switched at package time, before any signing.
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
}

export default config
