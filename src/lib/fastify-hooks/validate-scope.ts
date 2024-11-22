import type { onRequestHookHandler } from 'fastify'
import { decode } from '../token.js'
import { invalid_token } from './errors.js'

export interface ValidateAccessTokenScopeConfig {
  prefix: string
  scope: string
}

// https://micropub.spec.indieweb.org/#scope
export const defValidateScopeInAccessToken = (
  config: ValidateAccessTokenScopeConfig
) => {
  const { prefix, scope } = config

  const validateScopeInAccessToken: onRequestHookHandler = (
    request,
    reply,
    done
  ) => {
    request.log.debug(
      `${prefix} validating that access token includes scope '${scope}'`
    )
    const auth = request.headers.authorization

    if (!auth) {
      const message = 'missing Authorization header'
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.micropubInvalidRequest(message)
    }

    const splits = auth.split(' ')

    if (splits.length !== 2) {
      const message = `no value for 'Bearer' in Authorization header`
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.code(invalid_token.code).send(invalid_token.payload(message))
    }

    const jwt = splits[1]

    const claims = decode({ jwt })

    const scopes = claims.scope.split(' ')
    request.log.debug(`${prefix} access token scopes: ${scopes.join(' ')}`)

    if (!scopes.includes(scope)) {
      const message = `access token does not include scope '${scope}'`
      request.log.warn(`${prefix} request ID ${request.id}: ${message}`)
      return reply.micropubInsufficientScope(message)
    }

    done()
  }

  return validateScopeInAccessToken
}
