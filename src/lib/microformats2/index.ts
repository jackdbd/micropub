import type { H_card } from './h-card.js'
import type { H_cite } from './h-cite.js'
import type { H_entry } from './h-entry.js'
import type { H_event } from './h-event.js'

/**
 * JSON schemas for microformats2 vocabularies.
 *
 * TODO: move these to their own library.
 *
 * - https://microformats.org/wiki/microformats2
 * - https://indieweb.org/microformats2
 */
export { geo_uri } from './geo.js'

export { h_adr, type H_adr } from './h-adr.js'

export { h_card, type H_card } from './h-card.js'

export { h_cite, type H_cite } from './h-cite.js'

export { h_entry, type H_entry } from './h-entry.js'

export { h_event, type H_event } from './h-event.js'

export { h_geo, type H_geo } from './h-geo.js'

export { h_item, type H_item } from './h-item.js'

// https://micropub.spec.indieweb.org/#examples-of-creating-objects
export type Jf2PostType = 'card' | 'cite' | 'entry' | 'event'
export type Mf2PostType = 'h-card' | 'h-cite' | 'h-entry' | 'h-event'

// TODO: implement the following mf2 formats:
// - h-resume https://microformats.org/wiki/h-resume

// It's probably not worth implementing h-review.
// https://microformats.org/wiki/h-review

export type Mf2 = H_card | H_cite | H_entry | H_event
