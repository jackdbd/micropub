import { me_after_url_canonicalization } from '@jackdbd/indieauth'
import { errorResponseFromJSONResponse, scope } from '@jackdbd/oauth2'
import { ServerError } from '@jackdbd/oauth2-error-responses'
import { Static, Type } from '@sinclair/typebox'

/**
 * Response body to a successful Authorization Request.
 *
 * If the user approves the request, the authorization endpoint generates an
 * authorization code and builds the redirect back to the client.
 *
 * @see [Authorization Response - IndieAuth](https://indieauth.spec.indieweb.org/#authorization-response)
 * @see [Authorization Response - The OAuth 2.0 Authorization Framework (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2)
 */
export const authorization_response_body_success = Type.Object({
  me: me_after_url_canonicalization,
  scope: Type.Optional(scope)
})

export type AuthorizationResponseBodySuccess = Static<
  typeof authorization_response_body_success
>

export interface Config {
  authorization_endpoint: string
  client_id: string
  code: string
  code_verifier: string
  redirect_uri: string
}

export const verifyAuthorizationCode = async (config: Config) => {
  const {
    authorization_endpoint,
    client_id,
    code,
    code_verifier,
    redirect_uri
  } = config

  let response: Response
  try {
    response = await fetch(authorization_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id,
        code,
        code_verifier,
        grant_type: 'authorization_code',
        redirect_uri
      })
    })
  } catch (ex: any) {
    const error_description = `Failed to fetch ${authorization_endpoint}: ${ex.message}`
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  if (!response.ok) {
    const error = await errorResponseFromJSONResponse(response)
    return { error }
  }

  let res_body: AuthorizationResponseBodySuccess
  try {
    res_body = await response.json()
  } catch (ex: any) {
    const error_description = `Failed to parse JSON response received from ${authorization_endpoint}: ${ex.message}`
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  return { value: res_body }
}
