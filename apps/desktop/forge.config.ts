import { execFileSync } from 'node:child_process'
import { cp, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { MakerBase } from '@electron-forge/maker-base'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig, ForgePlatform } from '@electron-forge/shared-types'
import { FuseV1Options, FuseVersion } from '@electron/fuses'
import { loadEnv } from 'vite'

import { fixedServerFrom } from './src/main/utils/fixed-server'

// One master in the client package, one folder per platform (see packages/client: npm run icons).
const icons = path.resolve(import.meta.dirname, '../../packages/client/src/shared/assets/brand/icons')

const require = createRequire(import.meta.url)
const buildForge = require('app-builder-lib').buildForge as (
  forgeOptions: { dir: string },
  options: { linux: string[]; config: Record<string, unknown> },
) => Promise<string[]>

/** Adapter for electron-builder's AppImage target, whose package exports a maker function. */
class MakerAppImage extends MakerBase<Record<string, never>> {
  name = 'appimage'
  defaultPlatforms: ForgePlatform[] = ['linux']

  isSupportedOnCurrentPlatform() {
    return true
  }

  make({ dir, targetArch }: { dir: string; targetArch: string }) {
    return buildForge(
      { dir },
      {
        linux: [`appimage:${targetArch}`],
        config: {
          directories: { output: path.join(path.dirname(dir), 'make') },
          linux: {
            icon: path.join(icons, 'linux'),
            category: 'Utility',
            syncDesktopName: true,
          },
        },
      },
    )
  }
}

/** The system being packaged for, which is not the one running Forge when cross-building (--platform win32 on Linux). */
function targetPlatform(): NodeJS.Platform {
  const index = process.argv.findIndex((arg) => arg === '--platform' || arg.startsWith('--platform='))
  if (index === -1) return process.platform
  const arg = process.argv[index]!
  return (arg.includes('=') ? arg.split('=')[1] : process.argv[index + 1]) as NodeJS.Platform
}

/** What of each package the app needs when it runs (the rest is source and build files). */
const NATIVE_PACKAGES = [
  { name: '@vencord/venmic', keep: ['package.json', 'lib', 'prebuilds'] },
  { name: 'pkg-prebuilds', keep: ['package.json', 'bindings.js', 'lib'] },
]

/** The Windows helper that captures the sound of the computer without the app (native/audio-capture). */
const audioCaptureDir = path.resolve(import.meta.dirname, 'native/audio-capture')
const audioCaptureExe = path.join(audioCaptureDir, 'build/gameplay-audio-capture.exe')

const config: ForgeConfig = {
  packagerConfig: {
    name: 'gameplay',
    executableName: 'gameplay',
    // A native module cannot be loaded from inside the archive.
    asar: { unpack: '**/*.node' },
    // The packager adds the extension of the system it builds for: .ico on Windows, .icns on macOS. Linux has
    // none (the deb maker and the window carry the PNG).
    icon: path.join(icons, targetPlatform() === 'win32' ? 'windows/icon' : 'macos/icon'),
    // The helper sits next to the app, outside the archive: it is a program, not a module.
    extraResource: targetPlatform() === 'win32' ? [audioCaptureExe] : [],
  },
  hooks: {
    // What the build is (VITE_APP_ENV) and its server (VITE_SERVER_URL) come from the .env or the CI. A production
    // installer must be tied to a server, and a build that says nothing about itself is not packaged.
    prePackage: async () => {
      const { VITE_APP_ENV, VITE_SERVER_URL } = loadEnv('production', import.meta.dirname, 'VITE_')
      fixedServerFrom(VITE_APP_ENV, VITE_SERVER_URL)
      // The Windows package carries the audio helper, built with mingw-w64 (on Linux, or in an MSYS2 shell).
      if (targetPlatform() === 'win32')
        execFileSync('bash', [path.join(audioCaptureDir, 'build.sh')], { stdio: 'inherit' })
    },
    // The Vite plugin leaves node_modules out of the package: the native audio module (Linux only) and the loader
    // it needs are put back. On a system without them (Windows, macOS) there is nothing to copy.
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      for (const { name, keep } of NATIVE_PACKAGES) {
        let source: string
        try {
          source = path.dirname(require.resolve(`${name}/package.json`))
        } catch {
          continue
        }
        const target = path.join(buildPath, 'node_modules', name)
        await mkdir(target, { recursive: true })
        for (const entry of keep) await cp(path.join(source, entry), path.join(target, entry), { recursive: true })
      }
    },
  },
  // Linux and Windows; macOS and signing come with the packaging ticket. AppImage is built through app-builder-lib
  // in the adapter above because the current Forge 8 maker resolver expects a MakerBase class.
  makers: [
    new MakerZIP({}, ['linux', 'win32']),
    // AppImage is supplied by electron-builder's Forge integration. Keep it as
    // a maker so the Linux release shares the same Forge package and version.
    new MakerAppImage(),
    new MakerSquirrel({
      // CamelCase, no spaces: it names the NuGet package. The installer file takes productName.
      name: 'Gameplay',
      setupIcon: path.join(icons, 'windows/icon.ico'),
    }),
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
  // `npm run publish`: makes the installers and attaches them to a GitHub release tagged v{version}, with the token of
  // the workflow (GITHUB_TOKEN). Published at once (the Forge default is a draft), with the notes GitHub writes.
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: { owner: 'christiancesar', name: 'gameplay' },
        draft: false,
        prerelease: false,
        generateReleaseNotes: true,
      },
    },
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
