import Ajv from 'ajv'
import type { onRequestHookHandler } from 'fastify'
import { NAME } from './constants.js'
import { micropub_get_request } from './schemas.js'

// TODO: decode the token only once. Maybe move most code to a library.
const PREFIX = `${NAME}/hooks`

export interface ValidateAccessTokenConfig {
  me: string
}

export interface ValidateGetConfig {
  ajv: Ajv
}

export const defValidateGetRequest = (config: ValidateGetConfig) => {
  const { ajv } = config
  const validate = ajv.compile(micropub_get_request)

  const validateGetRequest: onRequestHookHandler = (request, reply, done) => {
    request.log.debug(`${PREFIX} validating incoming GET request`)

    const valid = validate(request)

    if (!valid) {
      const errors = validate.errors || []
      const message = errors
        .map((error) => error.message || 'no error message')
        .join('; ')
      request.log.warn(`${PREFIX} request ID ${request.id}: ${message}`)
      return reply.micropubInvalidRequest(message)
    }

    done()
  }

  return validateGetRequest
}
