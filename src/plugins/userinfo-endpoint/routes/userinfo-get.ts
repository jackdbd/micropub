import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  InvalidRequestError,
  UnauthorizedError
} from '../../../lib/fastify-errors/index.js'
import { githubUser } from './github.js'

interface Querystring {
  provider: string
}

// TODO: how to understand that we need to fetch user's info from one
// authentication provider vs another one? Maybe specify the provider in the
// query string? Read specs.

// GitHub userinfo uses OpenID Connect discovery. I think I would need a
// .well-known/openid-configuration file hosted at my profile URL to make it work.
// https://github.com/fastify/fastify-oauth2?tab=readme-ov-file#utilities

export interface Options {
  log_prefix?: string
}

export const defUserinfoGet = (options?: Options) => {
  const opt = options ?? ({} as Options)
  const log_prefix = opt.log_prefix ?? 'userinfo-get '

  return async function userinfoGet(
    this: FastifyInstance,
    request: FastifyRequest<{ Querystring: Querystring }>,
    reply: FastifyReply
  ) {
    const authorization = request.headers.authorization
    if (!authorization) {
      const error_description = `Authorization header not set.`
      throw new UnauthorizedError({ error_description })
    }

    const [_bearer, access_token] = authorization.split(' ')

    if (!access_token) {
      const error_description = `Access token not set.`
      throw new UnauthorizedError({ error_description })
    }

    const { provider } = request.query

    if (provider !== 'github') {
      const error_description = `Authentication provider ${provider} not supported.`
      throw new InvalidRequestError({ error_description })
    }

    request.log.debug(`${log_prefix}fetch ${provider} userinfo endpoint`)
    // This errors out and mentions "discovery" (OIDC discovery I think)
    // const user = await this.githubOAuth2.userinfo(access_token)
    const user = await githubUser({ access_token })

    return reply.send(user)
  }
}
