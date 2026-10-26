/** Stands in for `useMediaQuery`: specs set whether the phone is sideways, then rerender. */
const fakeMediaQuery = { matches: false }

const useFakeMediaQuery = (_query: string) => fakeMediaQuery.matches

export { fakeMediaQuery, useFakeMediaQuery }
