const publicContentKeys = {
  all: ['public-content'] as const,
  roadmap: () => [...publicContentKeys.all, 'roadmap'] as const,
  changelog: () => [...publicContentKeys.all, 'changelog'] as const,
}

export { publicContentKeys }
