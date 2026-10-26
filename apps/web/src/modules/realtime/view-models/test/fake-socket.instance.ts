import { FakeSocket } from './fake-socket'

/** The socket `createSocket()` returns inside specs (wire it with `vi.mock('@/shared/lib/socket')`). */
const fakeSocket = new FakeSocket()

export { fakeSocket }
