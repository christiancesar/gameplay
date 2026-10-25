import { useLocation } from '@tanstack/react-router'

export function PendingScreen() {
  const location = useLocation()

  return (
    <div className="flex h-full min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <p className="text-muted-foreground text-sm">Route placeholder</p>
        <p className="mt-1 font-mono text-xs">{location.pathname}</p>
      </div>
    </div>
  )
}
