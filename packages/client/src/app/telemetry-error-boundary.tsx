import { Component, type ErrorInfo, type ReactNode } from 'react'

import { telemetry } from '@/shared/lib/telemetry/current-telemetry'

type Props = { fallback: ReactNode; children: ReactNode }
type State = { failed: boolean }

/** Shows the fallback when something below throws while rendering, and reports the error through the telemetry. */
export class TelemetryErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    telemetry.captureError(error, { componentStack: info.componentStack })
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
