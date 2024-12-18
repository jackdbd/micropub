import { Static, Type } from '@sinclair/typebox'
import { me } from '../../../lib/schemas/index.js'
import { client_id as indieauth_client_id } from '../../../lib/indieauth/index.js'
import {
  authorization_code,
  grant_type,
  redirect_uri,
  response_type,
  state
} from '../../../lib/oauth2/index.js'
import {
  code_challenge,
  code_challenge_method,
  code_verifier
} from '../../../lib/pkce/index.js'

// https://auth0.com/docs/authenticate/protocols/oauth

// https://indieweb.org/scope
// IndieAuth scopes: email, profile
// Micropub scopes: create, update, delete, undelete, draft, media
// IndieAuth scopes + micropub scopes?
const scope = Type.String({ minLength: 1 })

export const auth_get_request_querystring = Type.Object({
  client_id: indieauth_client_id,
  code_challenge,
  code_challenge_method,
  me,
  redirect_uri,
  response_type: { ...response_type, default: 'code' },
  scope,
  state
})

export type AuthGetRequestQuerystring = Static<
  typeof auth_get_request_querystring
>

// https://indieauth.spec.indieweb.org/#request
export const auth_post_request_body = Type.Object({
  client_id: indieauth_client_id,
  code: authorization_code,
  code_verifier,
  grant_type: { ...grant_type, default: 'authorization_code' },
  redirect_uri
})

export type AuthPostRequestBody = Static<typeof auth_post_request_body>

export const auth_post_response_body_success = Type.Object({
  me,
  scope
})

export type AuthPostResponseBodySuccess = Static<
  typeof auth_post_response_body_success
>

const iss = Type.String({
  minLength: 1,
  description: 'The issuer identifier for client validation.'
})

// https://indieauth.spec.indieweb.org/#authorization-response
const DESCRIPTION = `Querystring built by the authorization endpoint.
If the user approves the request, the authorization endpoint generates an
authorization code and builds the redirect back to the client.`

export const auth_callback_querystring = Type.Object(
  {
    code: authorization_code,
    iss: Type.Optional(iss),
    state: {
      ...state,
      description:
        'The state parameter MUST be set to the exact value that the client set in the request.'
    }
  },
  { $id: 'authorization-callback-querystring', description: DESCRIPTION }
)

export type AuthCallbackQuerystring = Static<typeof auth_callback_querystring>
