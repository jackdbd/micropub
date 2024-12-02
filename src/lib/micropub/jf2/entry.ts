import { type Static, Type } from '@sinclair/typebox'
import { h_entry } from '../../microformats2/index.js'
import { date_time } from './date-time.js'
import {
  access_token,
  action,
  mp_limit,
  mp_post_status,
  mp_slug,
  mp_syndicate_to,
  mp_visibility
} from './micropub-reserved-properties.js'
import { audio } from './audio.js'
import { photo } from './photo.js'
import { video } from './video.js'

export const mp_entry = Type.Object(
  {
    ...h_entry.properties,

    access_token: Type.Optional(Type.Ref(access_token)),

    action: Type.Optional(Type.Ref(action, { default: 'create' })),

    audio: Type.Optional(Type.Ref(audio)),

    h: Type.Optional(Type.Literal('entry', { default: 'entry' })),

    limit: Type.Optional(Type.Ref(mp_limit)),

    'mp-slug': Type.Optional(Type.Ref(mp_slug)),

    'mp-syndicate-to': Type.Optional(Type.Ref(mp_syndicate_to)),

    photo: Type.Optional(Type.Ref(photo)),

    post_status: Type.Optional(Type.Ref(mp_post_status)),

    published: Type.Optional(Type.Ref(date_time)),

    // Since in Micropub we use `h` to indicate the type of the object, we don't
    // need `type` to be present. But if it is, it must be 'entry'.
    type: Type.Optional(Type.Literal('entry')),

    updated: Type.Optional(Type.Ref(date_time)),

    video: Type.Optional(Type.Ref(video)),

    visibility: Type.Optional(Type.Ref(mp_visibility, { default: 'public' }))
  },
  { $id: 'micropub-entry', title: 'Micropub h=entry' }
)

export type MP_Entry = Static<typeof mp_entry>
