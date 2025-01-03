import { Static, Type } from '@sinclair/typebox'
import { state } from './schemas.js'

/**
 * Error type.
 *
 * @see [Obtaining Authorization - Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1)
 * @see [Issuing an Access Token - Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-5.2)
 * @see [Refreshing an Access Token - Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-7.2)
 */
export const error_type = Type.Union(
  [
    Type.Literal('access_denied'),
    Type.Literal('invalid_client'),
    Type.Literal('invalid_grant'),
    Type.Literal('invalid_request'),
    Type.Literal('invalid_scope'),
    Type.Literal('server_error'),
    Type.Literal('temporarily_unavailable'),
    Type.Literal('unauthorized_client'),
    Type.Literal('unsupported_grant_type'),
    Type.Literal('unsupported_response_type')
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

/**
 * Error Response.
 *
 * @see [Obtaining Authorization - Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1)
 * @see [Issuing an Access Token - Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-5.2)
 * @see [Refreshing an Access Token - Error Response](https://datatracker.ietf.org/doc/html/rfc6749#section-7.2)
 */
export const error_response = Type.Object({
  /**
   * A single ASCII error code.
   */
  error: Type.String({ minLength: 1 }),
  // This is too strict and makes the whole `error_response` schema very hard to
  // use for enforcing schemas in error responses (it causes validation errors).
  // This could be used only if an authorization server extends this schema with
  // their error types. For example, a Micropub server would need to add
  // 'forbidden' and 'unauthorized' as error types.
  // error: error_type,

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

export interface ErrorResponseBody extends ErrorResponse {
  code?: string
  message?: string
}

export interface PayloadOptions {
  include_error_description?: boolean
}

export const errorResponseFromJSONResponse = async (response: Response) => {
  const body: ErrorResponseBody = await response.json()

  return {
    statusCode: response.status,
    payload: (options?: PayloadOptions) => {
      const opt = options || {}
      const include_error_description = opt.include_error_description ?? false

      const default_error =
        response.status >= 500 ? 'server_error' : 'invalid_request'

      const default_error_description = response.statusText

      return include_error_description
        ? {
            error: body.error || body.message || default_error,
            error_description:
              body.error_description || default_error_description,
            error_uri: body.error_uri,
            state: body.state
          }
        : { error: body.error }
    }
  }
}
