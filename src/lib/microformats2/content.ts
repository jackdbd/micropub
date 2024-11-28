import { Static, Type } from '@sinclair/typebox'
import { text, html } from './reserved-properties.js'

export const html_and_optional_text = Type.Object(
  {
    html,
    text: Type.Optional(text)
  },
  {
    description:
      'Some text content that has both a `text/plain` representation and a `text/html` representation',
    examples: [
      {
        html: '<p>note that has both <code>HTML</code> and plain text</p>',
        text: 'note that has both HTML and plain text'
      },
      {
        html: '<p>note with <strong>ONLY</strong>HTML</p>'
      }
    ],
    $id: 'content-with-html-and-text',
    title: 'content with `html` and `text`'
  }
)

export const content = Type.Union([text, html_and_optional_text])

export type Content = Static<typeof content>
