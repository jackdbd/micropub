import type { onRequestAsyncHookHandler } from 'fastify'
import { defIsAuthenticated } from '../../../lib/fastify-request-predicates/index.js'
import { IsAccessTokenBlacklisted } from '../../../lib/schemas/is-blacklisted.js'

export interface Config {
  isAccessTokenBlacklisted: IsAccessTokenBlacklisted
  logPrefix: string
  redirectPath: string
}

export const defRedirectWhenNotAuthenticated = (config: Config) => {
  const { isAccessTokenBlacklisted, logPrefix, redirectPath } = config

  const isAuthenticated = defIsAuthenticated({
    isAccessTokenBlacklisted,
    logPrefix
  })

  const redirectWhenNotAuthenticated: onRequestAsyncHookHandler = async (
    request,
    reply
  ) => {
    const is_authenticated = await isAuthenticated(request)
    if (!is_authenticated) {
      request.log.debug(
        `${logPrefix}cannot access ${request.url} because not authenticated; redirecting to ${redirectPath}`
      )
      return reply.redirect(redirectPath)
    }
  }

  return redirectWhenNotAuthenticated
}
