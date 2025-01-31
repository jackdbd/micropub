import type { Publication } from '@jackdbd/micropub'
import type { Log } from './log.js'

interface Config {
  log: Log
  publication: Publication
}

export const defPublishedUrlToStorageLocation = (config: Config) => {
  const { log, publication } = config

  // E.g. A note published on my website: https://www.giacomodebidda.com/notes/test-note/

  const publishedUrlToStorageLocation = (url: string) => {
    const [_domain, ...splits] = url.split('/').slice(2)
    const slug = splits.filter((s) => s !== '').at(-1)

    const loc = publication.default.location

    const keys = Object.keys(publication.items)
    log.debug(`supported publications: ${keys.join(', ')}`)

    for (const [key, item] of Object.entries(publication.items)) {
      const { location, predicate } = item
      if (predicate.website(url)) {
        log.debug(`matched predicate: ${key}`)
        loc.store = `${location.store}${slug}.md`
        loc.website = `${location.website}${slug}/`

        if (location.store_deleted) {
          loc.store_deleted = `${location.store_deleted}${slug}.md`
        } else {
          loc.store_deleted = undefined
        }

        break
      }
    }

    return loc
  }

  return publishedUrlToStorageLocation
}
