import * as spred from '../jf2-predicates.js'
import type { Publication } from '../micropub/index.js'
import * as wpred from '../website-predicates.js'

interface Config {
  domain: string
  subdomain: string
}

export const defDefaultPublication = (config: Config): Publication => {
  const { domain, subdomain } = config

  const base_url = subdomain
    ? `https://${subdomain}.${domain}`
    : `https://${domain}`

  return {
    default: {
      location: {
        store: 'default/',
        store_deleted: 'deleted/default/',
        website: `${base_url}/default/`
      }
    },
    items: {
      bookmark: {
        predicate: { store: spred.isBookmark, website: wpred.isBookmark },
        location: {
          store: `bookmarks/`,
          // TIP: comment out store_deleted to test that bookmarks can only be
          // hard-deleted and cannot be undeleted.
          store_deleted: 'deleted/bookmarks/',
          website: `${base_url}/bookmarks/`
        }
      },
      card: {
        predicate: { store: spred.isCard, website: wpred.isCard },
        location: {
          store: `cards/`,
          store_deleted: 'deleted/cards/',
          website: `${base_url}/cards/`
        }
      },
      event: {
        predicate: { store: spred.isEvent, website: wpred.isEvent },
        location: {
          store: `events/`,
          store_deleted: 'deleted/events/',
          website: `${base_url}/events/`
        }
      },
      like: {
        predicate: { store: spred.isLike, website: wpred.isLike },
        location: {
          store: `likes/`,
          store_deleted: 'deleted/likes/',
          website: `${base_url}/likes/`
        }
      },
      note: {
        predicate: { store: spred.isNote, website: wpred.isNote },
        location: {
          store: `notes/`,
          store_deleted: 'deleted/notes/',
          website: `${base_url}/notes/`
        }
      },
      reply: {
        predicate: { store: spred.isReply, website: wpred.isReply },
        location: {
          store: `replies/`,
          store_deleted: 'deleted/replies/',
          website: `${base_url}/replies/`
        }
      },
      repost: {
        predicate: { store: spred.isRepost, website: wpred.isRepost },
        location: {
          store: `reposts/`,
          store_deleted: 'deleted/reposts/',
          website: `${base_url}/reposts/`
        }
      },
      rsvp: {
        predicate: { store: spred.isRsvp, website: wpred.isRsvp },
        location: {
          store: `rsvp/`,
          store_deleted: 'rsvp/likes/',
          website: `${base_url}/rsvp/`
        }
      }
    }
  }
}
