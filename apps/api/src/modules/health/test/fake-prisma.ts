import type { PrismaService } from '../../../lib/prisma'

// A PrismaService whose raw query answers with the given function.
export function fakePrisma(queryRaw: () => Promise<unknown>): PrismaService {
  return { $queryRaw: queryRaw } as unknown as PrismaService
}
