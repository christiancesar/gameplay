const publicContentKeys = {
  all: ['public-content'] as const,
  roadmap: () => [...publicContentKeys.all, 'roadmap'] as const,
}

export { publicContentKeys }
