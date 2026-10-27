/** A zustand-shaped store in memory, for the sessions. */
class FakeSessionStore<T extends object> {
  state: T

  constructor(initial: T) {
    this.state = initial
  }

  getState() {
    return this.state
  }

  setState(partial: Partial<T>) {
    this.state = { ...this.state, ...partial }
  }
}

export { FakeSessionStore }
