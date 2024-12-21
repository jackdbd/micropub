export type ErrorType =
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable'

// This interface is annoying to use by IndieAuth/Micropub errors because they
// would need to extend ErrorType.
// interface GenericErrorResponse<T extends ErrorType = ErrorType> {
//   error: T
// }

/**
 * OAuth 2.0 [Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1)
 */
export interface ErrorResponse {
  error: string

  /**
   * A human-readable description of the error. This is meant to assist the
   * client developer in understanding the error. This is NOT meant to be shown
   * to the end user.
   */
  error_description?: string

  /**
   * A URI identifying a human-readable web page with information about the
   * error, used to provide the client developer with additional information
   * about the error.
   */
  error_uri?: string

  /**
   * REQUIRED if a "state" parameter was present in the client authorization
   * request. The exact value received from the client.
   */
  state?: string
}
