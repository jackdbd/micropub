import c from 'ansi-colors'

export const EMOJI = {
  ERROR: '❌',
  EXCEPTION: '🚨',
  EXIT_ONE: '🚩'
}

export type Result<V, E extends Error = Error> =
  | { error: E; value?: undefined }
  | { error?: undefined; value: V }

export const unwrap = <V, E extends Error = Error>(result: Result<V, E>) => {
  const { error, value } = result
  if (error) {
    console.error(c.red(`${EMOJI.ERROR} ${error.message}`))
    process.exit(1)
  }
  if (!value) {
    console.error(c.red(`${EMOJI.ERROR} value is undefined`))
    process.exit(1)
  }
  return value
}

export const unwrapP = async <V, E extends Error = Error>(
  promise: Promise<Result<V, E>>
) => {
  const result = await promise
  return unwrap(result)
}
