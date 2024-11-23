import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'

export interface Location {
  store: string
  store_deleted?: string
  website: string
}

export interface Predicate {
  store: (jf2: Jf2) => boolean
  website: (url: string) => boolean
}

export interface Item {
  location: Location
  predicate: Predicate
}

export interface Publication {
  default: { location: Location }
  items: Record<string, Item>
}
