declare module '@paulrobertlloyd/mf2tojf2' {
  export type Mf2Type = 'h-card' | 'h-cite' | 'h-entry' | 'h-event'

  export type Jf2Type = 'card' | 'cite' | 'entry' | 'event'

  export type Mf2PropertyValue =
    | string
    | string[]
    | Record<string, string | string[]>

  export interface Mf2Item {
    type: Mf2Type[]
    properties: Record<string, Mf2PropertyValue>
  }

  export interface Mf2 {
    items: Mf2Item[]
  }

  export interface Photo {
    alt: string
    url: string
  }

  // TODO: define location type

  /**
   * A `location` can be:
   *
   * - a plaintext string describing the location
   * - a Geo URI [RFC5870], for example: geo:45.51533714,-122.646538633
   * - an URL that contains an [h-card]
   * - a nested [h-adr] object
   *
   * @see https://micropub.spec.indieweb.org/#examples-of-creating-objects
   */
  export type Location = string

  // mp-syndicate-to - This property is giving a command to the Micropub endpoint,
  // rather than just creating data, so it uses the mp- prefix.

  // syndication - Pass one or more URLs pointing to places where this entry
  // already exists. Can be used for importing existing content to a site.

  export interface Jf2 {
    author?: string
    'bookmark-of'?: string
    category?: string[]
    content?: string
    date?: string
    'in-reply-to'?: string
    'like-of'?: string
    location?: Location
    'mp-slug'?: string
    'mp-syndicate-to'?: string | string[]
    name?: string
    photo: Photo[]
    published?: string
    'repost-of'?: string
    summary?: string
    syndication?: string | string[]
    updated?: string
    type: Jf2Type
    visibility?: string
  }

  function mf2tojf2(mf2: Mf2): Jf2

  function fetchReferences(jf2: string): Promise<string>

  function mf2tojf2referenced(mf2: Mf2): Promise<Jf2>
}
