import { z } from 'zod'

const downloadArtifactSchema = z.object({
  architecture: z.string().min(1),
  format: z.enum(['squirrel-installer', 'deb', 'appimage']),
  url: z.url(),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})

const downloadManifestSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  publishedAt: z.iso.datetime(),
  downloads: z.object({
    windows: downloadArtifactSchema,
    linuxDeb: downloadArtifactSchema,
    linuxAppImage: downloadArtifactSchema,
  }),
})

type DownloadManifest = z.infer<typeof downloadManifestSchema>

export { downloadManifestSchema }
export type { DownloadManifest }
