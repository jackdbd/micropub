import type { RouteHandler } from 'fastify'
import { nanoid } from 'nanoid'
import { unixTimestampInSeconds } from '../../../lib/date.js'
import { invalidRequest, serverError } from '../../../lib/micropub/index.js'
import { type TokenPostConfig as Config } from '../schemas.js'

interface ResponseBodyFromAuth {
  client_id: string
  code: string
  code_verifier: string
  grant_type: string
  redirect_uri: string
}

export const defTokenPost = (config: Config) => {
  const {
    authorization_endpoint,
    include_error_description,
    issueJWT,
    log_prefix
  } = config

  // OAuth 2.0 Access Token Request
  // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3

  const tokenPost: RouteHandler = async (request, reply) => {
    const { client_id, code, redirect_uri } =
      request.body as ResponseBodyFromAuth

    // https://indieweb.org/obtaining-an-access-token#Verifying_the_authorization_code
    const authResponse = await fetch(authorization_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ client_id, code, redirect_uri })
    })

    if (!authResponse.ok) {
      const error_description = `could not verify authorization code`
      request.log.warn(`${log_prefix}${error_description}`)

      const { code, body } = invalidRequest({
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    request.log.debug(`${log_prefix}verified authorization code`)

    let auth_res_body: { me: string; scope: string }
    try {
      auth_res_body = await authResponse.json()
    } catch (err: any) {
      const error_description = `Failed to parse the JSON response received from the authorization endpoint: ${err.message}`
      request.log.error(`${log_prefix}${error_description}`)

      // I don't think it's the client's fault if we couldn't parse the response
      // body, so we return a generic server error.
      const { code, body } = serverError({
        error: 'response_body_parse_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const { me, scope } = auth_res_body
    request.session.set('scope', scope)
    request.log.debug(`${log_prefix}stored scope in session`)

    const payload = { me, scope }
    const { error, value } = await issueJWT(payload)

    if (error) {
      const error_description = `Cannot issue JWT: ${error.message}`
      request.log.error(`${log_prefix}${error_description}`)

      const { code, body } = serverError({
        error: 'issue_jwt_error',
        error_description,
        include_error_description
      })

      return reply.errorResponse(code, body)
    }

    const { claims, jwt, message } = value

    if (message) {
      request.log.debug(message)
    }

    const { exp } = claims
    let expires_in: number | undefined
    if (exp) {
      expires_in = exp - unixTimestampInSeconds()
    }

    // OAuth 2.0 Access Token Response
    // https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.4

    return reply
      .header('Cache-Control', 'no-store')
      .header('Pragma', 'no-cache')
      .send({
        access_token: jwt,
        expires_in,
        me,
        payload: claims,
        refresh_token: nanoid(),
        scope,
        token_type: 'Bearer'
      })
  }

  return tokenPost
}
