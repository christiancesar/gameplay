/** Query keys of the notifications module. `notification:new` invalidates `all`. */
const notificationsKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationsKeys.all, 'list'] as const,
}

export { notificationsKeys }
