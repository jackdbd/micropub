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

  export interface Jf2 {
    author?: string
    'bookmark-of'?: string
    category?: string[]
    content?: string
    'in-reply-to'?: string
    'like-of'?: string
    location?: string
    'mp-slug'?: string
    'mp-syndicate-to'?: string[]
    name?: string
    photo: Photo[]
    'repost-of'?: string
    type: Jf2Type
  }

  function mf2tojf2(mf2: Mf2): Jf2

  function fetchReferences(jf2: string): Promise<string>

  function mf2tojf2referenced(mf2: Mf2): Promise<Jf2>
}
