import { type Static, Type } from '@sinclair/typebox'

const syndication_item = Type.String({
  description: 'syndication target',
  format: 'uri'
})

export const syndication = Type.Union(
  [syndication_item, Type.Array(syndication_item)],
  {
    description:
      'URL(s) of syndicated copies of this post. The property equivalent of rel-syndication.'
  }
)

export type Syndication = Static<typeof syndication>
