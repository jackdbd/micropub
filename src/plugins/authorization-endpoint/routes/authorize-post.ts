import type { RouteGenericInterface, RouteHandler } from 'fastify'
import type {
  RetrieveAuthorizationCode,
  StoreAuthorizationCode
} from '../../../lib/authorization-code-storage-interface/index.js'
import {
  InvalidGrantError,
  ServerError
} from '../../../lib/fastify-errors/index.js'
import { codeChallenge } from '../../../lib/pkce/index.js'
import { isExpired } from '../../../lib/predicates.js'
import type {
  AccessTokenRequestBody,
  ProfileUrlRequestBody
} from '../schemas.js'

interface RouteGeneric extends RouteGenericInterface {
  Body: AccessTokenRequestBody | ProfileUrlRequestBody
}

export interface Config {
  include_error_description: boolean
  log_prefix: string
  retrieveAuthorizationCode: RetrieveAuthorizationCode
  storeAuthorizationCode: StoreAuthorizationCode
}

/**
 * Verifies an authorization code and marks it as used.
 *
 * ### [Profile URL requests](https://indieauth.spec.indieweb.org/#request)
 *
 * If the client only needs to know the user who logged in, the client will
 * exchange the authorization code at the authorization endpoint, and only the
 * canonical user profile URL and possibly profile information is returned.
 *
 * ### [Requesting Profile Information](https://indieauth.spec.indieweb.org/#profile-information)
 *
 * If the client would like to request the user's profile information in
 * addition to confirming their profile URL, the client can include one or more
 * scopes in the initial authorization request. The following scope values are
 * defined by this specification to request profile information about the user:
 *
 * - `profile` (required) - This scope requests access to the user's default
 *   profile information which include the following properties: name, photo,
 *   url.
 * - `email` - This scope requests access to the user's email address in the
 *   following property: email.
 *
 * @see [Redeeming the Authorization Code - IndieAuth](https://indieauth.spec.indieweb.org/#redeeming-the-authorization-code)
 * @see [Verifying the authorization code - indieweb.org](https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code)
 */
export const defAuthorizePost = (config: Config) => {
  const {
    include_error_description,
    log_prefix: prefix,
    retrieveAuthorizationCode,
    storeAuthorizationCode
  } = config

  const authorize: RouteHandler<RouteGeneric> = async (request, reply) => {
    const { client_id, code, code_verifier, grant_type, redirect_uri } =
      request.body

    request.log.debug(
      `${prefix}verifying that ${code} is among stored authorization codes`
    )
    const { error: retrieve_error, value: record } =
      await retrieveAuthorizationCode(code)

    if (retrieve_error) {
      const error_description = `Cannot find ${code} among the authorization codes issued by this server.`
      request.log.warn(`${prefix}${error_description}`)
      const error_uri = undefined
      const err = new InvalidGrantError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { exp, me, scope, used } = record

    request.log.debug(`${prefix}verifying that code ${code} has not been used`)
    if (used) {
      const error_description = `Authorization code ${code} has already been used.`
      request.log.warn(`${prefix}${error_description}`)
      const error_uri = undefined
      const err = new InvalidGrantError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(`${prefix}verifying that code ${code} is not expired`)
    if (isExpired(exp)) {
      const error_description = `Authorization code ${code} is expired.`
      request.log.warn(`${prefix}${error_description}`)
      const error_uri = undefined
      const err = new InvalidGrantError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(
      `${prefix}verifying that code ${code} was issued for client_id ${client_id}`
    )
    if (client_id !== record.client_id) {
      const error_description = `Authorization code ${code} was issued for client_id ${record.client_id}, not ${client_id}.`
      request.log.warn(`${prefix}${error_description}`)
      const error_uri = undefined
      const err = new InvalidGrantError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(
      `${prefix}verifying that code ${code} was issued for redirect_uri ${redirect_uri}`
    )
    if (redirect_uri !== record.redirect_uri) {
      const error_description = `Authorization code ${code} was issued for redirect_uri ${record.redirect_uri}, not ${redirect_uri}.`
      const error_uri = undefined
      const err = new InvalidGrantError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(
      `${prefix}verifying that code_verifier from request body hashes to the same value as given in the code_challenge in the stored record about the original authorization request.`
    )
    const code_challenge = codeChallenge({
      method: record.code_challenge_method,
      code_verifier
    })
    if (code_challenge !== record.code_challenge) {
      const error_description = `The code_verifier provided in the request, hashed with ${record.code_challenge_method}, does not match to the code_challenge of the original authorization request.`
      const error_uri = undefined
      const err = new InvalidGrantError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    const { error } = await storeAuthorizationCode({
      ...record,
      code,
      used: true
    })

    if (error) {
      const original = error.message
      const error_description = `Error while marking the authorization code as used. ${original}`
      const error_uri = undefined
      const err = new ServerError({ error_description, error_uri })
      return reply
        .code(err.statusCode)
        .send(err.payload({ include_error_description }))
    }

    request.log.debug(
      `${prefix}verified authorization code ${code} and marked as used by client_id ${client_id}`
    )

    if (grant_type === 'authorization_code') {
      return reply.code(200).send({ me, scope })
    } else {
      return reply.code(200).send({ me })
    }
  }

  return authorize
}
