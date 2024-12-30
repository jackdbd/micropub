import { Static, Type } from '@sinclair/typebox'
import { client_id, me } from '../../../lib/indieauth/index.js'

export const consent_get_request_querystring = Type.Object({
  me
})

export type ConsentGetRequestQuerystring = Static<
  typeof consent_get_request_querystring
>

export const auth_start_get_request_querystring = Type.Object({
  client_id,
  me: Type.Union(
    [Type.String({ minLength: 1 }), Type.String({ format: 'uri' })],
    {
      description: `The 'me' value that the user typed in the login form for Web sign-in.`
    }
  )
})

export type AuthStartGetRequestQuerystring = Static<
  typeof auth_start_get_request_querystring
>
