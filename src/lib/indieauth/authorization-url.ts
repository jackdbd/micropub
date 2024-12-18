import { codeChallenge, codeVerifier } from '../pkce/index.js'

export interface Config {
  authorization_endpoint: string
  client_id: string
  code_challenge_method: string
  code_verifier_length: number
  me: string
  redirect_uri: string
  scopes: string[]
  state: string
}

/**
 * Builds the URL for the authorization endpoint.
 *
 * An IndieAuth client should build the URL using this function, and then it
 * should redirect to it.
 *
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 */
export const authorizationUrl = (config: Config) => {
  const {
    authorization_endpoint,
    client_id,
    code_challenge_method,
    code_verifier_length,
    me,
    redirect_uri,
    scopes,
    state
  } = config

  const code_verifier = codeVerifier({ len: code_verifier_length })

  // generate PKCE code challenge using code verifier
  const code_challenge = codeChallenge({
    code_verifier,
    method: code_challenge_method
  })

  const scope = scopes.join(' ')
  // const scope = scopes.join('+')
  // const scope = encodeURIComponent(scopes.join('+'))

  const query = {
    client_id,
    code_challenge,
    code_challenge_method,
    me,
    redirect_uri,
    response_type: 'code',
    scope,
    state
  }

  const qs = Object.entries(query).reduce((acc, [key, value]) => {
    return `${acc}&${key}=${encodeURIComponent(value)}`
  }, '')

  return { url: `${authorization_endpoint}?${qs}`, code_verifier, state }
}
