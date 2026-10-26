const hardwareKeys = {
  all: ['hardware'] as const,
  devices: () => [...hardwareKeys.all, 'devices'] as const,
}

export { hardwareKeys }
