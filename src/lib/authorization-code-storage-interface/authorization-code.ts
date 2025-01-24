import { Static, Type } from '@sinclair/typebox'
import { client_id, me_after_url_canonicalization } from '@jackdbd/indieauth'
import { redirect_uri, scope } from '@jackdbd/oauth2'
import { exp, iss } from '@jackdbd/oauth2-tokens'
import { code_challenge, code_challenge_method } from '@jackdbd/pkce'

/**
 * Authorization code issued by the authorization endpoint.
 *
 * OAuth 2.0 does not define a specific format for the authorization code issued
 * by the authorization endpoint. IndieAuth specifies that the authorization
 * code should be a single-use, unguessable, random string. However, it does not
 * prescribe a particular length, encoding, or algorithm to generate the code.
 */
export const code = Type.String({
  minLength: 10,
  maxLength: 128,
  description:
    'Authorization code issued by the authorization endpoint. It should be a single-use, unguessable, random string.'
})

/**
 * Authorization code issued by the authorization endpoint.
 */
export type Code = Static<typeof code>

export const authorization_code_props = Type.Object(
  {
    client_id,
    code,
    code_challenge,
    code_challenge_method,
    exp,
    iss: Type.Optional(iss),
    me: me_after_url_canonicalization,
    redirect_uri,
    scope,
    used: Type.Optional(Type.Boolean())
  },
  {
    $id: 'authorization-code-props',
    additionalProperties: false,
    title: 'Authorization Code Props',
    description:
      'Properties of an Authorization Code (a storage implementation may have addition properties)'
  }
)

export type AuthorizationCodeProps = Static<typeof authorization_code_props>
