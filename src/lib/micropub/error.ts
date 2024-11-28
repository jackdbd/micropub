import type { ClientError as ClientErrorCode } from './status-codes.js'

export type ClientErrorType =
  | 'invalid_request'
  | 'unauthorized'
  | 'forbidden'
  | 'insufficient_scope'

/**
 * Error code for when the Micropub client sent a valid request, but the server
 * failed to process the request for some reason.
 *
 * The Micropub spec does not define error codes for when it's the server's
 * fault. But I think it makes sense to define these error codes and maintain a
 * consistent error response body to return to the client.
 */
export type ServerErrorType =
  | 'upload_failed'
  | 'delete_failed'
  | 'undelete_failed'

export interface ErrorResponseBody {
  // This might be too strict. Users would probably need to cast generic strings
  // to this type.
  // error: ClientErrorType | ServerErrorType
  error: string

  /**
   * A human-readable description of the error. This is meant to assist the
   * Micropub client developer in understanding the error. This is NOT meant to
   * be shown to the end user.
   */
  error_description?: string
}

/**
 * @see https://micropub.spec.indieweb.org/#error-response
 */
export interface ClientErrorResponse {
  code: ClientErrorCode
  body: ErrorResponseBody
}

export interface ServerErrorResponse {
  code: ServerErrorType
  body: ErrorResponseBody
}

export interface ErrorResponse {
  code: ClientErrorType | ServerErrorType
  body: ErrorResponseBody
}
