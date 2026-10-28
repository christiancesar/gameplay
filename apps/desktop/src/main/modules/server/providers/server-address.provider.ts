// Where the server the user chose is kept between runs.
export abstract class ServerAddressProvider {
  // Null before the first choice, or when what was kept is not a server origin.
  abstract read(): Promise<string | null>
  abstract write(origin: string): Promise<void>
}
