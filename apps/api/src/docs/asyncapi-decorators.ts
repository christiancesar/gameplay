import type { AsyncApiSpecificOperationOptions } from 'nestjs-asyncapi'

type OperationDecorator = (options: AsyncApiSpecificOperationOptions) => MethodDecorator & ClassDecorator

type Decorators = {
  AsyncApiReceive: OperationDecorator
  AsyncApiSend: OperationDecorator
}

// nestjs-asyncapi is a dev dependency (it brings the AsyncAPI HTML generator,
// ~500 MB). Gateways import the decorators from here: with the package
// installed they record the docs metadata; in the production image, where it is
// absent, they do nothing. The decorators entry point does not load the generator.
function load(): Decorators {
  try {
    return require('nestjs-asyncapi/dist/lib/decorators') as Decorators
  } catch {
    const noop: OperationDecorator = () => () => undefined
    return { AsyncApiReceive: noop, AsyncApiSend: noop }
  }
}

// AsyncApiReceive: client to server. AsyncApiSend: server to client.
export const { AsyncApiReceive, AsyncApiSend } = load()
