import { applyToDefaults } from '@hapi/hoek'
import { throwWhenNotConform } from '@jackdbd/schema-validators'
import Ajv from 'ajv'
import type { onRequestHookHandler } from 'fastify'
import { defErrorIfActionNotAllowed } from '../../error-if-action-not-allowed.js'
import { DEFAULT } from './constants.js'
import { options as options_schema, type Options } from './schemas.js'

const defaults: Partial<Options> = {
  logPrefix: DEFAULT.LOG_PREFIX,
  reportAllAjvErrors: DEFAULT.REPORT_ALL_AJV_ERRORS
}

/**
 * Validates that the request context contains a decoded access token that has
 * the expected scope.
 *
 * @see https://micropub.spec.indieweb.org/#scope
 */
export const defValidateScope = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const { reportAllAjvErrors: allErrors, scope } = config

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = new Ajv({ allErrors })
  }

  throwWhenNotConform(
    { ajv, schema: options_schema, data: config },
    { basePath: 'validate-scope-options' }
  )

  const errorIfActionNotAllowed = defErrorIfActionNotAllowed()

  const validateScope: onRequestHookHandler = (request, _reply, done) => {
    // If this hook has no scope to check, then it's basically a NOP.
    if (!scope) {
      return done()
    }

    const error = errorIfActionNotAllowed(request, scope)

    if (error) {
      throw error
    }

    return done()
  }

  return validateScope
}
