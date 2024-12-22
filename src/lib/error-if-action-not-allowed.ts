import { FastifyRequest } from 'fastify'
import { insufficientScope, unauthorized } from './micropub/error-responses.js'
// import {
//   InsufficientScopeError,
//   UnauthorizedError
// } from '../lib/fastify-errors/index.js'

export interface Config {
  include_error_description: boolean
  log_prefix: string
}

export const defErrorIfActionNotAllowed = (config: Config) => {
  const { include_error_description, log_prefix } = config

  const errorIfActionNotAllowed = (request: FastifyRequest, scope: string) => {
    // Consider passing this getter as a configuration option. For example, one
    // might prefer storing/retrieving the claims from a session cookie.
    // The type definition should be: () => Claims | undefined
    const claims = request.session.get('claims')

    if (!claims) {
      const error_description = `request context has no access token claims`
      request.log.warn(`${log_prefix}${error_description}`)

      return unauthorized({
        error_description,
        include_error_description
      })
    }

    const scopes = claims.scope.split(' ')
    request.log.debug(`${log_prefix}access token scopes: ${scopes.join(' ')}`)

    // The Micropub server MUST require the bearer token to include at least one
    // scope value, in order to ensure posts cannot be created by arbitrary tokens.
    // https://micropub.spec.indieweb.org/#scope-p-1
    if (scopes.length < 1) {
      const error_description = `access token has no scopes`
      request.log.warn(`${log_prefix}${error_description}`)

      // return new InsufficientScopeError({
      //   error_description,
      //   error_uri: 'https://micropub.spec.indieweb.org/#error-response'
      // })

      return insufficientScope({
        error_description,
        include_error_description
      })
    }

    if (!scopes.includes(scope)) {
      const error_description = `access token does not include scope '${scope}'`
      request.log.warn(`${log_prefix}${error_description}`)

      return insufficientScope({
        error_description,
        include_error_description
      })
    }

    return undefined
  }

  return errorIfActionNotAllowed
}
