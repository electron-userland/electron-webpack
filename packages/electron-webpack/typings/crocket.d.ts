declare module "crocket" {
  export interface CrocketConnectOptions {
    path: string
  }

  export default class Crocket {
    connect(options: CrocketConnectOptions, connected: (error?: Error) => void): void

    listen(options: CrocketConnectOptions, handler: (error?: Error) => void): void

    on<T>(name: string, handler: (data: T) => void): void

    emit(name: string, data?: any): void
  }
}