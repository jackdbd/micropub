import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IsAccessTokenRevoked } from '@jackdbd/fastify-token-endpoint'
import { defIsAuthenticated } from '../../../lib/fastify-request-predicates/index.js'

export interface Config {
  isAccessTokenRevoked: IsAccessTokenRevoked
  logPrefix: string
  redirectPath: string
}

// TODO: this does not work as expected. Also, it should probably be renamed to
// redirectWhenNotAuthorized.
// TODO: define this hook in micropub-client, not here. And use less indirection.

export const defRedirectWhenNotAuthenticated = (config: Config) => {
  const { isAccessTokenRevoked, logPrefix, redirectPath } = config

  const isAuthenticated = defIsAuthenticated({
    isAccessTokenRevoked,
    logPrefix
  })

  return async function redirectWhenNotAuthenticated(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const is_authenticated = await isAuthenticated(request)

    if (!is_authenticated) {
      request.log.debug(
        `${logPrefix}cannot access ${request.url} because not authenticated; redirecting to ${redirectPath}`
      )
      return reply.redirect(redirectPath)
    }
  }
}
