import type { FastifyRequest } from 'fastify'
import { insufficientScope } from '../../../lib/micropub/index.js'
import { Action } from '../../../lib/schemas/index.js'
import { NAME } from '../constants.js'

const PREFIX = `${NAME}/decorators/request `

export interface NoScopeResponseOptions {
  include_error_description?: boolean
}

export function noScopeResponse(
  this: FastifyRequest,
  action: Action,
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
