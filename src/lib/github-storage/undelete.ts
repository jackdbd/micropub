import { applyToDefaults } from '@hapi/hoek'
import type { AuthorOrCommitter } from '@jackdbd/github-contents-api'
import { BASE_URL, GITHUB_TOKEN } from '@jackdbd/github-contents-api/defaults'
import * as api from '@jackdbd/github-contents-api'
import type { Log } from './log.js'
import type { Publication } from '@jackdbd/micropub'
import type { Undelete } from '../../lib/schemas/index.js'
import { defPublishedUrlToStorageLocation } from './published-url-to-storage-location.js'

export interface Options {
  base_url?: string
  committer: AuthorOrCommitter
  log?: Log
  owner?: string
  publication: Publication
  repo?: string
  token?: string
}

const defaults: Partial<Options> = {
  base_url: BASE_URL,
  token: GITHUB_TOKEN
}

export const defUndelete = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const { base_url, committer, log, owner, publication, repo, token } = config

  const publishedUrlToStorageLocation = defPublishedUrlToStorageLocation({
    log,
    publication
  })

  const undelete: Undelete = async (url) => {
    const loc = publishedUrlToStorageLocation(url)

    if (!loc.store_deleted) {
      const error_description = `Cannot undelete post published at ${loc.website} because it does not specify a location for when it's deleted.`
      return {
        // error: { status_code: 409, status_text: 'Conflict', error_description }
        error: new Error(error_description)
      }
    }

    const result = await api.move({
      base_url,
      committer,
      path_before: loc.store_deleted,
      path_after: loc.store,
      owner,
      repo,
      token
    })

    if (result.error) {
      const { error_description: original } = result.error
      const error_description = `Cannot undelete post published at ${loc.website}. ${original}`
      return { error: new Error(error_description) }
    } else {
      return { value: result.value }
    }
  }

  return undelete
}
