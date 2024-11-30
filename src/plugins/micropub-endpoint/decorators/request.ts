import type { FastifyRequest } from 'fastify'
import {
  insufficientScope,
  invalidRequest,
  type StoreAction
} from '../../../lib/micropub/index.js'
import { NAME } from '../constants.js'

const PREFIX = `${NAME}/decorators/request `

export interface NoScopeResponseOptions {
  include_error_description?: boolean
}

export function noScopeResponse(
  this: FastifyRequest,
  action: StoreAction,
  options?: NoScopeResponseOptions
) {
  const opt = options || ({} as NoScopeResponseOptions)
  const include_error_description = opt.include_error_description || false

  const error_description = `action '${action}' not allowed, since access token has no scope '${action}'`
  this.log.warn(`${PREFIX}${error_description}`)

  const { code, body } = insufficientScope({
    error_description,
    include_error_description
  })

  return { code, body }
}

export interface NoActionSupportedResponseOptions {
  include_error_description?: boolean
}

export function noActionSupportedResponse(
  this: FastifyRequest,
  action: StoreAction,
  options?: NoActionSupportedResponseOptions
) {
  const opt = options || ({} as NoActionSupportedResponseOptions)
  const include_error_description = opt.include_error_description || false

  const error_description = `Action '${action}' is not supported by this Micropub server.`
  this.log.warn(`${PREFIX}${error_description}`)

  const { code, body } = invalidRequest({
    error_description,
    include_error_description
  })

  return { code, body }
}
