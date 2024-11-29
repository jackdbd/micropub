import { Static, Type } from '@sinclair/typebox'

export const e_content = Type.Object(
  {
    html: Type.String({
      description:
        'The text/html version of the containing object. `html` MUST be a single string value only.',
      minLength: 1
    }),
    text: Type.Optional(
      Type.String({
        description:
          'The text/plain version of the containing object. `text` MUST be a single string value only.',
        minLength: 1
      })
    )
  },
  {
    $id: 'e-content',
    title: 'content with `html` and optional `text`'
  }
)

export type E_Content = Static<typeof e_content>
