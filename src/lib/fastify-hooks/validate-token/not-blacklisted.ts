import Ajv from 'ajv'
import type { onRequestAsyncHookHandler } from 'fastify'
import { applyToDefaults } from '@hapi/hoek'
import {
  invalidToken,
  serverError,
  unauthorized
} from '../../micropub/error-responses.js'
import type { AccessTokenClaims } from '../../token/claims.js'
import { safeDecode } from '../../token/decode.js'
import { throwIfDoesNotConform } from '../../validators.js'
import { options as options_schema, Options } from './schemas.js'

const defaults: Partial<Options> = {
  include_error_description: false,
  key_in_session: 'access_token',
  log_prefix: '',
  report_all_ajv_errors: false
}

const authorizationHeaderToToken = (auth?: string) => {
  if (!auth) {
    return { error: new Error('Missing Authorization') }
  }

  if (auth.indexOf('Bearer') === -1) {
    return { error: new Error('Missing Bearer') }
  }

  const splits = auth.split(' ')
  if (splits.length !== 2) {
    return { error: new Error('Missing value for Bearer') }
  }

  return { value: splits[1] }
}

export const defValidateAccessTokenNotBlacklisted = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const hkey = 'authorization'
  const { isBlacklisted, key_in_session, log_prefix: prefix } = config
  const allErrors = config.report_all_ajv_errors as boolean
  const include_error_description = config.include_error_description as boolean

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = new Ajv({ allErrors })
  }

  throwIfDoesNotConform({ prefix }, ajv, options_schema, config)

  const validateAccessTokenNotBlacklisted: onRequestAsyncHookHandler = async (
    request,
    reply
  ) => {
    let jwt = request.session.get(key_in_session)

    if (!jwt) {
      const { error, value } = authorizationHeaderToToken(request.headers[hkey])
      if (value) {
        jwt = value
      } else {
        if (error) {
          const error_description = error.message
          request.log.warn(`${prefix}${error_description}`)

          const { code, body } = invalidToken({
            error_description,
            include_error_description
          })

          return reply.errorResponse(code, body)
        }
      }
    }

    if (!jwt) {
      const error_description = `access token not found neither in session, nor in request header ${hkey}`
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const { error: decode_error, value: claims } =
      await safeDecode<AccessTokenClaims>(jwt)

    if (decode_error) {
      const error_description = decode_error.message
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const { jti } = claims
    request.log.debug(
      `${prefix}validating that token ID ${jti} is not blacklisted`
    )

    const { error: black_err, value: blacklisted } = await isBlacklisted(jti)

    if (black_err) {
      const error_description = black_err.message
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'storage_is_blacklisted_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    if (blacklisted) {
      const error_description = `Token ${jti} is blacklisted.`
      // use a warn level to easily spot this log entry.
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidToken({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }
  }

  return validateAccessTokenNotBlacklisted
}
