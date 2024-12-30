import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface
} from 'fastify'
import { ServerError } from '../../../lib/fastify-errors/index.js'
import type { AuthorizationResponseQuerystring } from '../../authorization-endpoint/routes/schemas.js'

interface RouteGeneric extends RouteGenericInterface {
  Querystring: AuthorizationResponseQuerystring
}

export interface Options {
  indieauth_client_id?: string
  indieauth_start_path?: string
  log_prefix?: string
}

export const defAuthorizationCallback = (options?: Options) => {
  const opt = options ?? ({} as Options)
  const log_prefix = opt.log_prefix ?? 'auth-github-callback '
  const indieauth_client_id = opt.indieauth_client_id ?? ''
  const indieauth_start_path =
    opt.indieauth_start_path ?? '/auth/indieauth/start'

  return async function authorizationCallback(
    this: FastifyInstance,
    request: FastifyRequest<RouteGeneric>,
    reply: FastifyReply
  ) {
    // const { code, iss, state } = request.query
    // let access_token: string | undefined
    // let refresh_token: string | undefined
    // let id_token: string | undefined
    try {
      const obj =
        await this.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
      request.log.debug(obj, `${log_prefix}response from token endpoint`)
      // access_token = obj.token.access_token
      // refresh_token = obj.token.refresh_token
      // id_token = obj.token.id_token
    } catch (err: any) {
      const original = err.message
      const error_description = `Cannot exchange authorization code for an access token: ${original}`
      throw new ServerError({ error_description })
    }

    const me = request.session.get('me')

    // const provider = 'github'
    const redirect_path = `${indieauth_start_path}?client_id=${indieauth_client_id}&me=${me}`
    // const redirect_path = `/user?provider=${provider}`
    request.log.debug(`${log_prefix}redirect to ${redirect_path}`)
    return reply.redirect(redirect_path)
  }
}
