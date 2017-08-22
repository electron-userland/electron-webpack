declare namespace __WebpackModuleApi {
  interface Hot {
    check(isAutoApply?: boolean): Promise<Array<string> | null>

    apply(options?: AcceptOptions): Promise<Array<string>>

    status(): "abort" | "fail" | "idle"
  }
}
