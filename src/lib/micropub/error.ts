import type { ClientError as ClientErrorCode } from './status-codes.js'

export type ClientErrorType =
  | 'invalid_request'
  | 'unauthorized'
  | 'forbidden'
  | 'insufficient_scope'

export interface ClientErrorResponseBody {
  // error: ClientErrorType // too strict. Users would need to cast generic strings to this type
  error: string
  error_description?: string
}

/**
 * @see https://micropub.spec.indieweb.org/#error-response
 */
export interface ClientErrorResponse {
  code: ClientErrorCode // too strict. Users would need to cast generic numbers to this type
  // code: number
  body: ClientErrorResponseBody
}
