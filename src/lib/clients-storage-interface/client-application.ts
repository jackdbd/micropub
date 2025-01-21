import { Static, Type } from '@sinclair/typebox'
import { client_id, me_after_url_canonicalization } from '@jackdbd/indieauth'
import { redirect_uri } from '@jackdbd/oauth2'

export const client_application_props = Type.Object(
  {
    client_id,
    me: me_after_url_canonicalization,
    redirect_uri
  },
  {
    $id: 'client-application-props',
    additionalProperties: false,
    title: 'Client Application Props',
    description:
      'Properties of a client application (a storage implementation may have addition properties)'
  }
)

export type ClientApplicationProps = Static<typeof client_application_props>
