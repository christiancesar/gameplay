import { useEffect, useState } from 'react'

/** Follows `value` after it stays still for `delayMs`; used so a search box does not query on every key. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export { useDebouncedValue }
