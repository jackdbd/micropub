import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { RetrieveRecord } from '../../../lib/crud.js'
import {
  InsufficientScopeError,
  InvalidRequestError,
  InvalidTokenError,
  ServerError,
  UnauthorizedError
} from '../../../lib/fastify-errors/index.js'
import { accessTokenFromRequestHeader } from '../../../lib/fastify-utils/index.js'
import type { Profile } from '../../../lib/indieauth/index.js'
import { safeDecode, type AccessTokenClaims } from '../../../lib/token/index.js'
// import { githubUser } from './github.js'

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
  retrieveProfile: RetrieveRecord<Profile>
}

export const defUserinfoGet = (config: Config) => {
  const { include_error_description, retrieveProfile } = config

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

    const { value: access_token } = accessTokenFromRequestHeader(request)

    if (!access_token) {
      const error_description = `Cannot retrieve profile info: no access token in Authorization header.`
      const error_uri = undefined
      const err = new UnauthorizedError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { error: decode_error, value: claims } =
      await safeDecode<AccessTokenClaims>(access_token)

    if (decode_error) {
      const error_description = `Error while decoding access token: ${decode_error.message}`
      const error_uri = undefined
      const err = new InvalidTokenError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const scopes = claims.scope.split(' ')

    if (!scopes.includes('profile')) {
      const error_description = `Access token has no 'profile' scope.`
      const error_uri = undefined
      const err = new InsufficientScopeError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    // TODO: use the 'me' claim of the access token (the claim in the JWT or the
    // access token record) to fetch the user's profile from storage
    const { error: retrieve_error, value: profile } = await retrieveProfile(
      claims.me
    )

    if (retrieve_error) {
      const error_description = `Failed to retrieve ${claims.me} from storage: ${retrieve_error.message}`
      const error_uri = undefined
      // const err = new InvalidRequestError({ error_description, error_uri })
      const err = new ServerError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    if (!profile) {
      const error_description = `Cannot find ${claims.me} among the user profiles.`
      const error_uri = undefined
      const err = new InvalidRequestError({ error_description, error_uri })
      // const err = new ServerError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    if (!scopes.includes('email')) {
      profile.email = undefined
    }

    // const { provider } = request.query

    // if (provider !== 'github') {
    //   const error_description = `Authentication provider ${provider} not supported.`
    //   const err = new InvalidRequestError({ error_description })
    //   return reply
    //     .code(err.statusCode)
    //     .send(err.payload({ include_error_description }))
    // }

    // request.log.debug(`${log_prefix}fetch ${provider} userinfo endpoint`)

    // // This errors out and mentions "discovery" (OIDC discovery I think)
    // // const user = await this.githubOAuth2.userinfo(access_token)

    // const { error, value: user } = await githubUser({ access_token })

    // if (error) {
    //   return reply
    //     .code(error.statusCode)
    //     .send(error.payload({ include_error_description }))
    // }

    return reply.code(200).send(profile)
  }
}
