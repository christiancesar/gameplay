const downloadsKeys = {
  all: ['public-downloads'] as const,
  latest: () => [...downloadsKeys.all, 'latest'] as const,
}

export { downloadsKeys }
