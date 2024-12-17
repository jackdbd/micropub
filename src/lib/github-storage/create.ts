import { applyToDefaults } from '@hapi/hoek'
import type { Create } from '../../lib/schemas/index.js'
import { BASE_URL, GITHUB_TOKEN, REF } from '../github-contents-api/defaults.js'
import type { AuthorOrCommitter } from '../github-contents-api/index.js'
import * as api from '../github-contents-api/index.js'
import { jf2ToSlug, type Publication } from '../micropub/index.js'
import { jf2ToContent } from './jf2-to-content.js'
import type { Log } from './log.js'

export interface Options {
  author?: AuthorOrCommitter
  base_url?: string
  branch?: string
  committer: AuthorOrCommitter
  log?: Log
  owner?: string
  publication: Publication
  repo?: string
  token?: string
}

const defaults: Partial<Options> = {
  base_url: BASE_URL,
  branch: REF,
  token: GITHUB_TOKEN
}

export const defCreate = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const {
    author,
    base_url,
    branch,
    committer,
    log,
    owner,
    publication,
    repo,
    token
  } = config

  const create: Create = async (jf2) => {
    const content = jf2ToContent(jf2)
    const slug = jf2ToSlug(jf2)
    const filename = `${slug}.md`

    const loc = {
      store: `${publication.default.location.store}${filename}`,
      website: `${publication.default.location.website}${slug}/`
    }

    const keys = Object.keys(publication.items)
    log.debug(`supported publications: ${keys.join(', ')}`)

    for (const [key, item] of Object.entries(publication.items)) {
      const { location, predicate } = item
      if (predicate.store(jf2)) {
        log.debug(`matched predicate: ${key}`)
        loc.store = `${location.store}${filename}`
        loc.website = `${location.website}${slug}/`
        break
      }
    }

    // TODO: if the `me` website already has a post with the same slug as the
    // one suggested suggested with `mp-slug`, we could regenerate a new slug
    // (maybe with an UUID) and try again. We would need to know the matching
    // URL => location in store and website. We could put the for loop above in
    // a function that takes `publication` and outputs `loc`.
    // We would also need to know whether the content is HTML or plain text, so
    // we can use the correct file extension when saving the file in the store.
    // See also: https://indieweb.org/Micropub-extensions#Slug

    log.debug(
      `trying to store ${jf2.h} as base64-encoded string at ${loc.store}`
    )

    const result = await api.createOrUpdate({
      author,
      base_url,
      branch,
      committer,
      content,
      owner,
      path: loc.store,
      repo,
      token
    })

    if (result.error) {
      // In this case the original error message from the GitHub Contents API is not that useful.
      // const { error_description: original } = result.error
      const error_description = `Cannot create ${loc.store} in repository ${owner}/${repo}. Make sure there isn't already a file at that path.`
      // return { error: { ...result.error, error_description } }
      return { error: new Error(error_description) }
    } else {
      const summary = `Post ot type '${jf2.h}' created at ${loc.store} in repo ${owner}/${repo} on branch ${branch}. Committed by ${committer.name} (${committer.email}). The post will be published at ${loc.website}.`
      log.debug(summary)
      return {
        value: { ...result.value, summary }
      }
    }
  }

  return create
}
