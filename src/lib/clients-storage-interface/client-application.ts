import { Static, Type } from '@sinclair/typebox'
import { client_id, me_after_url_canonicalization } from '../indieauth/index.js'
import { redirect_uri } from '../oauth2/index.js'

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
