import { useEffect, useState } from 'react'

/** Follows `value` after it stays still for `delayMs`; used so a search box does not query on every key. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    // Nothing to wait for while the value has not moved away from what is already applied.
    if (value === debounced) return
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, debounced, delayMs])
  return debounced
}

export { useDebouncedValue }
