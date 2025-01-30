import { u_url } from '@jackdbd/microformats2'
import { Static, Type } from '@sinclair/typebox'

// To upload one or more audio files, clients must make a multipart request.
// https://micropub.spec.indieweb.org/#uploading-files
// https://micropub.spec.indieweb.org/#posting-files

export const audio = Type.Union(
  [Type.Ref(u_url), Type.Array(Type.Ref(u_url))],
  {
    $id: 'micropub-audio',
    title: 'Micropub audio'
  }
)

export type Audio = Static<typeof audio>
