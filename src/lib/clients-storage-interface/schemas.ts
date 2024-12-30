import { Static, Type } from '@sinclair/typebox'
import { client_id, me, redirect_uri } from '../indieauth/index.js'

export const client_record = Type.Object({
  me,
  redirect_uri
})

export type ClientRecord = Static<typeof client_record>

export const client_table = Type.Record(client_id, client_record)

export type ClientTable = Static<typeof client_table>
