import { Static, Type } from '@sinclair/typebox'
import { client_id, me_after_url_canonicalization } from '../indieauth/index.js'
import { redirect_uri } from '../oauth2/index.js'

export const client_record = Type.Object({
  me: me_after_url_canonicalization,
  redirect_uri
})

export type ClientRecord = Static<typeof client_record>

export const client_table = Type.Record(client_id, client_record)

export type ClientTable = Static<typeof client_table>
