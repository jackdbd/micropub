import { Static, Type } from '@sinclair/typebox'
import {
  h_card,
  h_cite,
  h_entry,
  h_event
} from '../../../lib/microformats2/index.js'

export const micropub_get_request = Type.Object(
  { query: Type.Object({ q: Type.String() }) },
  {
    $id: 'micropub-get-request',
    title: 'micropub GET request',
    description: 'GET request hitting a micropub endpoint',
    additionalProperties: true
  }
)

export type MicropubGetRequest = Static<typeof micropub_get_request>

export const micropub_post_request = Type.Object(
  {
    body: Type.Union([
      Type.Ref(h_card),
      Type.Ref(h_cite),
      Type.Ref(h_entry),
      Type.Ref(h_event)
    ])
  },
  {
    $id: 'micropub-post-request',
    title: 'micropub POST request',
    description: 'POST request hitting a micropub endpoint',
    additionalProperties: true
  }
)

export type MicropubPostRequest = Static<typeof micropub_post_request>
