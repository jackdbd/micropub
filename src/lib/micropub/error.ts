import type { ErrorResponse as ErrorResponseBody } from '../oauth2/index.js'
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
