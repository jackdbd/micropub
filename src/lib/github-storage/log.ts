export interface Log {
  debug: (...args: any) => void
  error: (...args: any) => void
}
