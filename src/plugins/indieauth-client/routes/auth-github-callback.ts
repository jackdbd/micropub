import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface
} from 'fastify'
import { ServerError } from '../../../lib/fastify-errors/index.js'

/**
 * Query string sent with the [authorization response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2).
 */
interface QueryString {
  code: string
  state: string
}

interface RouteGeneric extends RouteGenericInterface {
  Querystring: QueryString
}

export interface Options {
  log_prefix?: string
}

export const defAuthCallback = (options?: Options) => {
  const opt = options ?? ({} as Options)
  const log_prefix = opt.log_prefix ?? 'auth-github-callback '

  return async function (
    this: FastifyInstance,
    request: FastifyRequest<RouteGeneric>,
    reply: FastifyReply
  ) {
    let access_token: string | undefined
    let refresh_token: string | undefined
    // let id_token: string | undefined
    try {
      const obj =
        await this.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
      request.log.debug(obj, `${log_prefix}response from token endpoint`)
      access_token = obj.token.access_token
      refresh_token = obj.token.refresh_token
      // id_token = obj.token.id_token
    } catch (err: any) {
      const original = err.message
      const error_description = `Cannot exchange authorization code for an access token: ${original}`
      throw new ServerError({ error_description })
    }

    request.session.set('access_token', access_token)
    request.log.debug(`${log_prefix}set access token in session`)

    if (refresh_token) {
      request.session.set('refresh_token', refresh_token)
      request.log.debug(`${log_prefix}set refresh token in session`)
    }

    const provider = 'github'
    request.log.debug(`${log_prefix}redirect to /user?provider=${provider}`)
    return reply.redirect(`/user?provider=${provider}`)
  }
}
