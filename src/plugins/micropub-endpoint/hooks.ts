import Ajv from 'ajv'
import type { preHandlerHookHandler } from 'fastify'

import { hasScope } from '../../lib/fastify-request-predicates/index.js'
import {
  insufficientScope,
  invalidRequest,
  type StoreAction
} from '../../lib/micropub/index.js'

import { NAME } from './constants.js'
import { micropub_get_request } from './schemas.js'

const PREFIX = `${NAME}/hooks `

export interface ValidateAccessTokenConfig {
  me: string
}

export interface ValidateGetConfig {
  ajv: Ajv
  include_error_description: boolean
}

export const defValidateGetRequest = (config: ValidateGetConfig) => {
  const { ajv, include_error_description } = config
  const validate = ajv.compile(micropub_get_request)

  const validateGetRequest: preHandlerHookHandler = (request, reply, done) => {
    request.log.debug(`${PREFIX}validating incoming GET request`)

    const valid = validate(request)

    if (!valid) {
      const errors = validate.errors || []
      const error_description = errors
        .map((error) => error.message || 'no error message')
        .join('; ')
      request.log.warn(`${PREFIX}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    done()
  }

  return validateGetRequest
}

export const defEnsureRequestHasScope = (config: {
  include_error_description: boolean
}) => {
  const { include_error_description } = config

  const ensureRequestHasScope: preHandlerHookHandler = (
    request,
    reply,
    done
  ) => {
    let action: StoreAction = 'create'
    if (request.body && (request.body as any).action) {
      action = (request.body as any).action as StoreAction
    }

    if (!hasScope(request, action)) {
      const error_description = `action '${action}' not allowed, since access token has no scope '${action}'`
      request.log.warn(`${PREFIX}${error_description}`)

      const { code, body } = insufficientScope({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    return done()
  }

  return ensureRequestHasScope
}
