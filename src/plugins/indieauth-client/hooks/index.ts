import type { onRequestAsyncHookHandler } from 'fastify'
import { defIsAuthenticated } from '../../../lib/fastify-request-predicates/index.js'
import { IsBlacklisted } from '../../../lib/schemas/is-blacklisted.js'

export interface Config {
  isBlacklisted: IsBlacklisted
  logPrefix: string
}

export const defRedirectWhenNotAuthenticated = (config: Config) => {
  const { isBlacklisted, logPrefix } = config

  const isAuthenticated = defIsAuthenticated({ isBlacklisted, logPrefix })

  const redirectWhenNotAuthenticated: onRequestAsyncHookHandler = async (
    request,
    reply
  ) => {
    const is_authenticated = await isAuthenticated(request)
    if (!is_authenticated) {
      request.log.debug(
        `${logPrefix}cannot access ${request.url} because not authenticated; redirecting to /login`
      )
      return reply.redirect('/login')
    }
  }

  return redirectWhenNotAuthenticated
}
