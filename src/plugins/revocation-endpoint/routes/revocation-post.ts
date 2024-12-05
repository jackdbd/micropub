import type { RouteGenericInterface, RouteHandler } from 'fastify'
import {
  secondsToUTCString,
  unixTimestampInSeconds
} from '../../../lib/date.js'
import {
  invalidRequest,
  serverError
} from '../../../lib/micropub/error-responses.js'
import {
  errorIfMethodNotImplementedInStore,
  type TokenStore
} from '../../../lib/micropub/store/index.js'
import { safeDecode } from '../../../lib/token/decode.js'

interface RequestBody {
  token: string
}

interface RouteGeneric extends RouteGenericInterface {
  Body: RequestBody
}

interface Config {
  include_error_description: boolean
  me: string
  prefix: string
  store: TokenStore
}

/**
 * https://indieauth.spec.indieweb.org/#token-revocation
 */
export const defRevocationPost = (config: Config) => {
  const { include_error_description, me, prefix, store } = config

  const revocationPost: RouteHandler<RouteGeneric> = async (request, reply) => {
    if (!request.body) {
      return reply.badRequest('missing request body')
    }

    const { token } = request.body

    if (!token) {
      const error_description = 'No `token` in request body.'

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'No token in request body',
        description: 'Revocation endpoint error page'
      })
    }

    const store_error = errorIfMethodNotImplementedInStore(store, 'revoke')
    if (store_error) {
      const { code, body } = store_error
      return reply.errorResponse(code, body)
    }

    const { error: error_decode, value: claims } = await safeDecode(token)

    if (error_decode) {
      const original = error_decode.message
      const error_description = `cannot decode token: ${original}`
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Token revocation failed',
        description: 'Revocation endpoint error page'
      })
    }

    const unix_now = unixTimestampInSeconds()
    if (claims.exp < unix_now) {
      const exp = secondsToUTCString(claims.exp)
      const now = secondsToUTCString(unix_now)
      const error_description = `The token expired ${exp} (now is ${now})`
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Token revocation failed',
        description: 'Revocation endpoint error page'
      })
    }

    if (claims.me !== me) {
      const error_description = `The token has a claim me=${claims.me}. This endpoint can only revoke tokens that have me=${me}`
      request.log.warn(`${prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Token revocation failed',
        description: 'Revocation endpoint error page'
      })
    }

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
    const base_url = process.env.BASE_URL || `http://localhost:${port}`

    if (claims.iss !== base_url) {
      request.log.warn(
        { base_url, claims_iss: claims.iss, request_host: request.host },
        `${prefix}claims.iss !== base_url (read specs on what should I do here)`
      )
    }

    // const token_secret = request.session.get('token_secret')
    // request.log.debug(
    //   { token_secret: token_secret || 'none' },
    //   `${prefix}token secret from session`
    // )

    request.log.debug(claims, `${prefix}try revoking token`)
    const result = await store.revoke(token)

    if (result.error) {
      const original = result.error.message
      const error_description = `cannot revoke token: ${original}`
      request.log.error(`${prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'revoke_failed',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    } else {
      // const sss = result.value
      console.log('🚀 ~ === result.value:', result.value)
      const code = 200
      const summary = `token revoked`

      return reply.successResponse(code, {
        title: 'Token revoked',
        description: 'Token revoke success page',
        summary
      })
    }
  }

  return revocationPost
}
