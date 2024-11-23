import Ajv from 'ajv'
import type { onRequestHookHandler } from 'fastify'
import { INSUFFICIENT_SCOPE, INVALID_REQUEST } from '../../lib/http-error.js'
import type { ActionType } from '../../lib/micropub/index.js'
import { NAME } from './constants.js'
import { micropub_get_request } from './schemas.js'

const PREFIX = `${NAME}/hooks `

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
    request.log.debug(`${PREFIX}validating incoming GET request`)

    const valid = validate(request)

    if (!valid) {
      const errors = validate.errors || []
      const error_description = errors
        .map((error) => error.message || 'no error message')
        .join('; ')
      request.log.warn(`${PREFIX}${error_description}`)

      return reply.micropubErrorResponse(INVALID_REQUEST.code, {
        error: INVALID_REQUEST.error,
        error_description
      })
    }

    done()
  }

  return validateGetRequest
}

export const defEnsureRequestHasScope = (config: {
  include_error_description: boolean
}) => {
  const { include_error_description } = config

  const ensureRequestHasScope: onRequestHookHandler = (
    request,
    reply,
    done
  ) => {
    let action: ActionType = 'create'
    if (request.body && (request.body as any).action) {
      action = (request.body as any).action as ActionType
    }

    if (!request.hasScope(action)) {
      const error_description = `action '${action}' not allowed, since access token has no scope '${action}'`
      request.log.warn(`${PREFIX}${error_description}`)

      const error = INSUFFICIENT_SCOPE.error

      const body = include_error_description
        ? { error, error_description }
        : { error }

      return reply.micropubErrorResponse(INSUFFICIENT_SCOPE.code, body)
    }

    return done()
  }

  return ensureRequestHasScope
}
