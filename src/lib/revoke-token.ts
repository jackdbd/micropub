import { Static, Type } from '@sinclair/typebox'
import { ServerError } from '@jackdbd/oauth2-error-responses'
import { errorResponseFromJSONResponse } from '@jackdbd/oauth2'

export const revocation_response_body_success = Type.Object({
  message: Type.Optional(Type.String({ minLength: 1 }))
})

export type RevocationResponseBodySuccess = Static<
  typeof revocation_response_body_success
>

export interface Config {
  access_token: string
  revocation_endpoint: string
  revocation_reason: string
  token: string
  token_type_hint: string
}

export const revokeToken = async (config: Config) => {
  const {
    access_token,
    revocation_endpoint,
    revocation_reason,
    token,
    token_type_hint
  } = config

  let response: Response
  try {
    response = await fetch(revocation_endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ token, token_type_hint, revocation_reason })
    })
  } catch (ex: any) {
    const error_description = `Failed to fetch ${revocation_endpoint}: ${ex.message}`
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  if (!response.ok) {
    const error = await errorResponseFromJSONResponse(response)
    return { error }
  }

  let res_body: RevocationResponseBodySuccess
  try {
    res_body = await response.json()
  } catch (ex: any) {
    const error_description = `Failed to parse JSON response received from ${revocation_endpoint}: ${ex.message}`
    const error_uri = undefined
    return { error: new ServerError({ error_description, error_uri }) }
  }

  let message: string
  if (res_body.message) {
    message = res_body.message
  } else {
    message = `Revoked ${token_type_hint} (revocation reason: ${revocation_reason})`
  }

  return { value: { message } }
}
