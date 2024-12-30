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

export interface Config {
  include_error_description: boolean
  log_prefix: string
}

export const defUserinfoGet = (config: Config) => {
  const { include_error_description, log_prefix } = config

  return async function userinfoGet(
    this: FastifyInstance,
    request: FastifyRequest<{ Querystring: Querystring }>,
    reply: FastifyReply
  ) {
    const authorization = request.headers.authorization
    if (!authorization) {
      const error_description = `Authorization header not set.`
      const err = new UnauthorizedError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const [_bearer, access_token] = authorization.split(' ')

    if (!access_token) {
      const error_description = `Access token not set.`
      const err = new UnauthorizedError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { provider } = request.query

    if (provider !== 'github') {
      const error_description = `Authentication provider ${provider} not supported.`
      const err = new InvalidRequestError({ error_description })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(`${log_prefix}fetch ${provider} userinfo endpoint`)

    // This errors out and mentions "discovery" (OIDC discovery I think)
    // const user = await this.githubOAuth2.userinfo(access_token)

    const { error, value: user } = await githubUser({ access_token })

    if (error) {
      return reply
        .code(error.statusCode)
        .send(error.payload({ include_error_description }))
    }

    return reply.send(user)
  }
}
