/** Next icon of the loop. */
function nextIconIndex(current: number, total: number): number {
  return total <= 0 ? 0 : (current + 1) % total
}

/** The favicon only rotates while the tab is visible and the person did not ask for less motion. */
function shouldRotateFavicon(state: { hidden: boolean; reducedMotion: boolean }): boolean {
  return !state.hidden && !state.reducedMotion
}

export { nextIconIndex, shouldRotateFavicon }
