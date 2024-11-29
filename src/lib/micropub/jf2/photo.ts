import { Static, Type } from '@sinclair/typebox'
import { u_photo } from '../../microformats2/index.js'

// To upload a photo with a caption, send a multipart request that contains
// three parts, named: h, content and photo.
// https://micropub.spec.indieweb.org/#uploading-files

// To include alt text along with the image being uploaded, use an object with
// two properties: `value` being the URL, and `alt` being the alternate text.
// Note that in this case, you cannot also upload a file, you can only reference
// files by URL.
// https://micropub.spec.indieweb.org/#json-syntax

export const photo_url_and_alt_text = Type.Object(
  {
    alt: Type.String({
      description: 'alternate text for the photo',
      minLength: 1
    }),
    value: Type.Ref(u_photo)
  },
  {
    title: 'Micropub photo with URL and alt text'
  }
)

export const photo = Type.Union([Type.Ref(u_photo), photo_url_and_alt_text], {
  $id: 'micropub-photo',
  title: 'Micropub photo'
})

export type Photo = Static<typeof photo>
