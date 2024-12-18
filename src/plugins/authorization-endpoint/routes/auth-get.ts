import crypto from 'node:crypto'
import type { RouteHandler } from 'fastify'
import ms, { StringValue } from 'ms'
import { unixTimestampInMs } from '../../../lib/date.js'
import { clientMetadata } from '../../../lib/indieauth/index.js'
import {
  invalidRequest,
  serverError
} from '../../../lib/micropub/error-responses.js'
import type { IssueCode } from '../../../lib/authorization-code-storage-interface/index.js'
import type { AuthGetRequestQuerystring } from './schemas.js'

export interface Config {
  access_token_expiration: string
  authorization_code_expiration: string
  include_error_description: boolean
  issueCode: IssueCode
  log_prefix: string
  refresh_token_expiration: string
}

// On IndieLogin, the consent screen is shown when visiting this URL:
// https://indieauth.com/auth?
// response_type=code
// me=https%3A%2F%2Fgiacomodebidda.com%2F
// redirect_uri=https%3A%2F%2Findielogin.com%2Fredirect%2Findieauth
// client_id=https%3A%2F%2Findielogin.com%2Fid
// state=f37cb16f048c49d9c5214588
// code_challenge=pgm2udX8Hvv9keE-yrcSfyP3sPHBK2j5ijy5qsB8jf0
// code_challenge_method=S256

// When clicking the GitHub authentication, IndieLogin redirects here:
// https://indieauth.com/auth/start?
// me=https%3A%2F%2Fgiacomodebidda.com%2F
// provider=github
// profile=https%3A%2F%2Fgithub.com%2Fjackdbd
// redirect_uri=https%3A%2F%2Findielogin.com%2Fredirect%2Findieauth

/**
 * Authorizes a client and issues a single-use authorization code.
 *
 * 1. The authorization endpoint fetches 'client_id' to retrieve information
 *    about the client (e.g. registered redirect URLs, name, icon, docs).
 * 2. The user authenticates and approves the request. The Authorization
 *    endpoint issues an authorization code (for single use), builds a redirect
 *    back to client.
 *
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 * @see [Authorization request - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-request)
 * @see [Authorization response - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-response)
 * @see [consent screen](https://indieweb.org/consent_screen)
 */
export const defAuthGet = (config: Config) => {
  const {
    access_token_expiration,
    authorization_code_expiration,
    include_error_description,
    issueCode,
    log_prefix,
    refresh_token_expiration
  } = config

  const authGet: RouteHandler<{
    Querystring: AuthGetRequestQuerystring
  }> = async (request, reply) => {
    const {
      client_id,
      code_challenge,
      code_challenge_method,
      me,
      response_type,
      scope,
      state
    } = request.query

    if (response_type !== 'code') {
      const error_description = `This authorization endpoint only supports the 'code' response type.`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    // The authorization endpoint SHOULD fetch the client_id URL to retrieve
    // application information and the client's registered redirect URLs.
    request.log.debug(
      `${log_prefix}fetch IndieAuth client metadata from client_id ${client_id}`
    )
    // This function already canonicalizes the client_id URL.
    const { error: client_metadata_error, value: client_metadata } =
      await clientMetadata(client_id)

    if (client_metadata_error) {
      const error_description = `Failed to fetch client metadata.`
      const original = client_metadata_error.message
      request.log.error(`${log_prefix}${error_description} ${original}`)

      const { code, body } = serverError({
        error: 'failed_to_fetch_client_metadata',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(client_metadata, 'IndieAuth client metadata')
    const { client_name, client_uri, logo_uri, redirect_uris } = client_metadata

    if (!redirect_uris) {
      const error_description = `Metadata of client ID ${client_id} does not contain redirect_uris`

      const { code, body } = serverError({
        error: 'invalid_client_metadata',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, {
        ...body,
        title: 'Auth error',
        description: 'Auth error page'
      })
    }

    // if (redirect_uris.length > 1) {
    //   request.log.warn(
    //     { redirect_uris },
    //     `${log_prefix}Client ${client_id} has more than one redirect URI. Using the first one.`
    //   )
    // }

    const redirect_uri = redirect_uris.find(
      (uri) => uri === request.query.redirect_uri
    )

    if (!redirect_uri) {
      const error_description = `Redirect URI from query string does not match any of the client's registered redirect URIs.`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.warn(
      { registered_by_client: redirect_uris, given_by_you: redirect_uri },
      `${log_prefix}redirect URLs`
    )

    // TODO: read specs on how to create an authorization code
    const code = crypto.randomBytes(12).toString('hex')
    // const now = unixTimestampInMs()
    // const seconds = ms(authorization_code_expiration) / 1000
    const exp =
      (unixTimestampInMs() + ms(authorization_code_expiration as StringValue)) /
      1000
    const result = await issueCode({ code, exp })
    request.log.warn(result, `${log_prefix}issued authorization code`)

    request.log.debug(`${log_prefix}render consent screen`)
    // client is a IndieAuth/Micropub client

    return reply.view('consent.njk', {
      access_token_expiration,
      authorization_code_expiration,
      // authorization_endpoint,
      // authorization_response_iss_parameter_supported,
      client_id,
      client_name,
      client_uri,
      code,
      code_challenge,
      code_challenge_method,
      description: 'User consent screen',
      // issuer,
      logo_uri,
      me,
      redirect_uri,
      refresh_token_expiration,
      response_type: 'code',
      scopes: scope.split(' '),
      state,
      title: 'Consent'
    })
  }

  return authGet
}
