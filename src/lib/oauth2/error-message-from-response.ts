import type { ErrorResponse } from './error-response.js'

export const errorMessageFromJSONResponse = async (response: Response) => {
  const body: ErrorResponse = await response.json()
  const message =
    body.error_description ?? `${response.statusText} (${response.status})`
  return message
}
