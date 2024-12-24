// import { InvalidRequestError } from '../fastify-errors/index.js'
import type { ErrorResponse } from './error-response.js'

interface Body extends ErrorResponse {
  error_description: string
}

// TODO: this should handle all OAuth2.0/IndieAuth/Micropub error responses.
// And it should return an error, not hust a string.

export const errorMessageFromJSONResponse = async (response: Response) => {
  const body: Body = await response.json()
  body.error_description =
    body.error_description ?? `${response.statusText} (${response.status})`

  // switch (body.error) {
  //   case 'invalid_request': {
  //     return new InvalidRequestError(body)
  //   }
  //   case 'server_error': {
  //     return new ServerError(body)
  //   }
  //   case 'unauthorized': {
  //     //
  //   }
  //   default: {
  //     //
  //   }
  // }

  return body.error_description
}
