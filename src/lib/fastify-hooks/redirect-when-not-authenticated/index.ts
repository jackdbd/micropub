import type { FastifyReply, FastifyRequest } from 'fastify'
import { defIsAuthenticated } from '../../fastify-request-predicates/index.js'
import { IsAccessTokenBlacklisted } from '../../schemas/is-blacklisted.js'

export interface Config {
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  logPrefix: string
  redirectPath: string
}

// TODO: this does not work as expected. Also, it should probably be renamed to
// redirectWhenNotAuthorized.
// TODO: define this hook in micropub-client, not here. And use less indirection.

export const defRedirectWhenNotAuthenticated = (config: Config) => {
  const { isAccessTokenBlacklisted, logPrefix, redirectPath } = config

  const isAuthenticated = defIsAuthenticated({
    isAccessTokenBlacklisted,
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
