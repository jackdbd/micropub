import { Static, Type } from '@sinclair/typebox'
import { state } from './schemas.js'

export const error_type = Type.Union(
  [
    Type.Literal('invalid_request'),
    Type.Literal('unauthorized_client'),
    Type.Literal('access_denied'),
    Type.Literal('unsupported_response_type'),
    Type.Literal('invalid_scope'),
    Type.Literal('server_error'),
    Type.Literal('temporarily_unavailable')
  ],
  { description: `A single ASCII error code.` }
)

export type ErrorType = Static<typeof error_type>

/**
 * OAuth 2.0 [Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1)
 */
export const error_description = Type.String({
  minLength: 1,
  description: `Human-readable ASCII text providing additional information, used to assist the client developer in understanding the error that occurred.`
})

export type ErrorDescription = Static<typeof error_description>

export const error_uri = Type.String({
  format: 'uri',
  description: `A URI identifying a human-readable web page with information about the error, used to provide the client developer with additional information about the error.`
})

export type ErrorUri = Static<typeof error_uri>

export const error_response = Type.Object({
  /**
   * A single ASCII error code.
   */
  error: error_type,
  /**
   * A human-readable description of the error. This is meant to assist the
   * client developer in understanding the error. This is NOT meant to be shown
   * to the end user.
   */
  error_description: Type.Optional(error_description),

  /**
   * A URI identifying a human-readable web page with information about the
   * error, used to provide the client developer with additional information
   * about the error.
   */
  error_uri: Type.Optional(error_uri),

  /**
   * REQUIRED if a "state" parameter was present in the client authorization
   * request. The exact value received from the client.
   */
  state: Type.Optional(state)
})

/**
 * OAuth 2.0 [Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1)
 */
export type ErrorResponse = Static<typeof error_response>

// This interface is annoying to use by IndieAuth/Micropub errors because they
// would need to extend ErrorType.
// interface GenericErrorResponse<T extends ErrorType = ErrorType> {
//   error: T
// }

/**
 * OAuth 2.0 [Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1)
 */
export interface ErrorResponseLoose {
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
