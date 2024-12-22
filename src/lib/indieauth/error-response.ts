import { Static, Type } from '@sinclair/typebox'
import {
  error_description,
  error_type as oauth2_error_type,
  error_uri,
  state
} from '../oauth2/index.js'

// export const error_type = Type.Union(
//   [
//     Type.Literal('insufficient_scope'),
//     Type.Literal('invalid_request'),
//     Type.Literal('invalid_token')
//   ],
//   { description: `A single ASCII error code.` }
// )

export const error_type = Type.Union(
  [
    oauth2_error_type,
    Type.Literal('insufficient_scope'),
    Type.Literal('invalid_token')
  ],
  { description: `A single ASCII error code.` }
)

export type ErrorType = Static<typeof error_type>

// export type ErrorType = Static<typeof indieauth_specific_error_type> | OAuth2ErrorType

/**
 * IndieAuth [Error Responses](https://indieauth.spec.indieweb.org/#error-responses).
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
 * IndieAuth [Error Responses](https://indieauth.spec.indieweb.org/#error-responses).
 */
export type ErrorResponse = Static<typeof error_response>
