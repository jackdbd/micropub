import type { onRequestAsyncHookHandler } from 'fastify'
import { unauthorized } from '../micropub/error-responses.js'
import type { AccessTokenClaims } from '../token/claims.js'
import { safeDecode } from '../token/decode.js'

export interface Options {
  header?: string
  include_error_description?: boolean
  key_in_header?: string
  log_prefix?: string
}

export const defDecodeJwtAndSetClaims = (options?: Options) => {
  const opt = options || {}
  const include_error_description = opt.include_error_description || false
  const hkey = opt.header || 'authorization'
  const log_prefix = opt.log_prefix || ''
  const key_in_header = opt.key_in_header || 'Bearer'

  const decodeJwtAndSetClaims: onRequestAsyncHookHandler = async (
    request,
    reply
  ) => {
    const hval = request.headers[hkey.toLowerCase()]

    if (!hval) {
      const error_description = `request has no ${hkey} header`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    // The value of a request header can be an array. This typically happens
    // when multiple headers with the same name are sent in a single request.
    // E.g. Set-Cookie.
    if (Array.isArray(hval)) {
      const error_description = `request header ${hkey} is an array`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const splits = hval.split(' ')

    if (splits.length !== 2) {
      const error_description = `request header ${hkey} has no ${key_in_header} value`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const jwt = splits.at(1)

    if (!jwt) {
      const error_description = `request header ${hkey} has no ${key_in_header} value`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const { error, value: claims } = await safeDecode<AccessTokenClaims>(jwt)

    if (error) {
      const error_description = `Error while decoding ${key_in_header} value in ${hkey} header: ${error.message}`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = unauthorized({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    // request.log.warn(claims, '=== JWT claims ===')
    request.requestContext.set('access_token_claims', claims)
    request.log.debug(
      `${log_prefix}stored access token claims in request context key 'access_token_claims'`
    )
  }

  return decodeJwtAndSetClaims
}
