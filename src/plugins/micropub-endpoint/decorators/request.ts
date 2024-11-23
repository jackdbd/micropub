import type { FastifyRequest } from 'fastify'
import { INSUFFICIENT_SCOPE, INVALID_REQUEST } from '../../../lib/http-error.js'
import type { ActionType } from '../../../lib/micropub/index.js'
import { NAME } from '../constants.js'

const PREFIX = `${NAME}/decorators/request `

export function hasScope(this: FastifyRequest, scope: string) {
  const claims = this.requestContext.get('access_token_claims')

  if (!claims) {
    return false
  }

  const scopes = claims.scope.split(' ')

  const boolean = scopes.includes(scope) ? true : false
  this.log.debug(`${PREFIX}does access token have scope '${scope}'? ${boolean}`)
  return boolean
}

export interface NoScopeResponseOptions {
  include_error_description?: boolean
}

export function noScopeResponse(
  this: FastifyRequest,
  action: ActionType,
  options?: NoScopeResponseOptions
) {
  const opt = options || ({} as NoScopeResponseOptions)
  const include_error_description = opt.include_error_description || false

  const error_description = `action '${action}' not allowed, since access token has no scope '${action}'`
  const error = INSUFFICIENT_SCOPE.error
  this.log.warn(`${PREFIX}${error_description}`)

  const body = include_error_description
    ? { error, error_description }
    : { error }

  return { code: INSUFFICIENT_SCOPE.code, body }
}

export interface NoActionSupportedResponseOptions {
  include_error_description?: boolean
}

export function noActionSupportedResponse(
  this: FastifyRequest,
  action: ActionType,
  options?: NoActionSupportedResponseOptions
) {
  const opt = options || ({} as NoScopeResponseOptions)
  const include_error_description = opt.include_error_description || false

  const error = INVALID_REQUEST.error
  const error_description = `Action '${action}' is not supported by this Micropub server.`
  this.log.warn(`${PREFIX}${error_description}`)

  const body = include_error_description
    ? { error, error_description }
    : { error }

  return { code: INVALID_REQUEST.code, body }
}
