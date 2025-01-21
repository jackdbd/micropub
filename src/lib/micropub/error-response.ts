import { Static, Type } from '@sinclair/typebox'
import { error_type as indieauth_error_type } from '@jackdbd/indieauth'
import { error_description, error_uri, state } from '@jackdbd/oauth2'

// export const error_type = Type.Union(
//   [
//     Type.Literal('forbidden'),
//     Type.Literal('insufficient_scope'),
//     Type.Literal('invalid_request'),
//     Type.Literal('unauthorized')
//   ],
//   { description: `A single ASCII error code.` }
// )

export const error_type = Type.Union(
  [
    indieauth_error_type,
    Type.Literal('forbidden'),
    Type.Literal('unauthorized')
  ],
  { description: `A single ASCII error code.` }
)

export type ErrorType = Static<typeof error_type>

/**
 * Micropub [Error Responses](https://micropub.spec.indieweb.org/#error-response).
 */
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

  state: Type.Optional(state)
})

/**
 * Micropub [Error Responses](https://micropub.spec.indieweb.org/#error-response).
 */
export type ErrorResponse = Static<typeof error_response>
