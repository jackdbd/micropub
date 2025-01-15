export interface Log {
  debug: (message: string, payload?: any) => void
  error: (message: string, payload?: any) => void
}

export const default_log: Log = {
  debug: (..._args: any) => {},
  error: (..._args: any) => {}
}
