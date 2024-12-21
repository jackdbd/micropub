import { codeChallenge, codeVerifier } from '../pkce/index.js'

export interface Config {
  authorization_endpoint: string
  client_id: string
  code_challenge_method: string
  code_verifier_length: number
  me: string
  redirect_uri: string
  scopes?: string[]
  state: string
}

export interface AuthRequestQuery
  extends Omit<
    Config,
    'authorization_endpoint' | 'code_verifier_length' | 'scopes'
  > {
  code_challenge: string
  response_type: 'code'
  scope?: string
}

/**
 * Builds the URL for the authorization endpoint.
 *
 * In the request to the authorization endpoint, the query parameter `scope` is
 * **optional**. If the IndieAuth client omits it, the authorization server MUST
 * NOT issue an access token in exchange of an authorization code, and should
 * instead return the profile URL. This means that the user will still be able
 * to authenticate using the request, but the IndieAuth client will not be
 * granted any scope (i.e. the user will not be authorized).
 *
 * @see [Authorization - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization)
 * @see [Authorization Request - IndieAuth spec](https://indieauth.spec.indieweb.org/#authorization-request)
 */
export const authorizationRequestUrl = (config: Config) => {
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

  const code_challenge = codeChallenge({
    code_verifier,
    method: code_challenge_method
  })

  // Which one should it be? scopes.join(' ') or scopes.join('+')

  const query = {
    client_id,
    code_challenge,
    code_challenge_method,
    me,
    redirect_uri,
    response_type: 'code',
    scope: scopes ? scopes.join(' ') : undefined,
    state
  }

  const qs = Object.entries(query).reduce((acc, [key, value]) => {
    return value ? `${acc}&${key}=${encodeURIComponent(value)}` : acc
  }, '')

  return {
    redirect_url: `${authorization_endpoint}?${qs}`,
    code_verifier,
    state
  }
}
