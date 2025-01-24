import { Static, Type } from '@sinclair/typebox'
import { client_id } from '@jackdbd/indieauth'
import { redirect_uri } from '@jackdbd/oauth2'
import { jti } from '@jackdbd/oauth2-tokens'
import { revoked, revocation_reason } from './revocation.js'

export const access_token_props = Type.Object(
  {
    client_id,
    jti,
    redirect_uri,
    revoked: Type.Optional(revoked),
    revocation_reason: Type.Optional(revocation_reason)
  },
  {
    $id: 'access-token-props',
    additionalProperties: false,
    description:
      'Properties of an access token (a storage implementation may have addition properties)',
    title: 'Access Token Props'
  }
)

export type AccessTokenProps = Static<typeof access_token_props>
