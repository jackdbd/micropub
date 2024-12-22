import type { onRequestAsyncHookHandler } from 'fastify'
import type { AccessTokenClaims } from '../../token/claims.js'
import { safeDecode } from '../../token/decode.js'
import {
  DEFAULT_HEADER,
  DEFAULT_HEADER_KEY,
  DEFAULT_LOG_PREFIX,
  // DEFAULT_REPORT_ALL_AJV_ERRORS,
  DEFAULT_SESSION_KEY
} from './constants.js'
import { type Options } from './schemas.js'

export const defDecodeJwtAndSetClaims = (options?: Options) => {
  const opt = options ?? {}
  const hkey = opt.header ? opt.header.toLowerCase() : DEFAULT_HEADER
  const header_key = opt.header_key ?? DEFAULT_HEADER_KEY
  const log_prefix = opt.log_prefix ?? DEFAULT_LOG_PREFIX
  // const report_all_ajv_errors =
  //   opt.report_all_ajv_errors || DEFAULT_REPORT_ALL_AJV_ERRORS
  const session_key = opt.session_key ?? DEFAULT_SESSION_KEY

  // TODO: validate options schema with Ajv

  const decodeJwtAndSetClaims: onRequestAsyncHookHandler = async (
    request,
    reply
  ) => {
    let access_token = request.session.get(session_key)

    if (!access_token) {
      const hval = request.headers[hkey.toLowerCase()]

      if (!hval) {
        const details = `Access token not found, neither in session key '${session_key}', nor in request header '${hkey}' (in '${header_key}').`
        const error_description = `Request has no access token. ${details}`

        // TODO: use https://github.com/fastify/fastify-error
        reply.code(401)
        const err = new Error(error_description)
        err.name = 'Unauthorized'
        // throw err
        throw { error: 'Unauthorized', error_description }
      }

      // The value of a request header can be an array. This typically happens
      // when multiple headers with the same name are sent in a single request.
      // (e.g. Set-Cookie). I don't think this is a case I should handle, so I
      // return an HTTP 401 error.
      if (Array.isArray(hval)) {
        const error_description = `Request header '${hkey}' is an array.`

        reply.code(401)
        const err = new Error(error_description)
        err.name = 'Unauthorized'
        throw err
      }

      const splits = hval.split(' ')

      if (splits.length !== 2) {
        const error_description = `Request header '${hkey}' has no '${header_key}' value.`

        reply.code(401)
        const err = new Error(error_description)
        err.name = 'Unauthorized'
        throw err
      }

      access_token = splits.at(1)
    }

    if (!access_token) {
      const details = `Access token not found, neither in session key '${session_key}', nor in request header '${hkey}' (in '${header_key}').`
      const error_description = `Request has no access token. ${details}`

      reply.code(401)
      const err = new Error(error_description)
      err.name = 'Unauthorized'
      throw err
    }

    const { error, value: claims } = await safeDecode<AccessTokenClaims>(
      access_token
    )

    if (error) {
      const error_description = `Error while decoding access token: ${error.message}`

      reply.code(401)
      const err = new Error(error_description)
      err.name = 'Unauthorized'
      throw err
    }

    // TODO: make it another configuration parameter. Maybe it should 'claims' by default.
    // Also, should I set this in the request context or in the session?
    request.session.set('claims', claims)
    request.log.debug(`${log_prefix}set access token decoded claims in session`)
  }

  return decodeJwtAndSetClaims
}
