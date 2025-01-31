import { applyToDefaults } from '@hapi/hoek'
import type { DeleteContentOrMedia } from '../../lib/schemas/index.js'
import type { AuthorOrCommitter } from '@jackdbd/github-contents-api'
import { BASE_URL, GITHUB_TOKEN } from '@jackdbd/github-contents-api/defaults'
import * as api from '@jackdbd/github-contents-api'
import type { Publication } from '@jackdbd/micropub'
import type { Log } from './log.js'
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

export const defSoftDelete = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const { base_url, committer, log, owner, publication, repo, token } = config

  const publishedUrlToStorageLocation = defPublishedUrlToStorageLocation({
    log,
    publication
  })

  const softDelete: DeleteContentOrMedia = async (url) => {
    const loc = publishedUrlToStorageLocation(url)

    if (!loc.store_deleted) {
      const error_description = `cannot soft-delete ${loc.website} because it does not specify a location for when it's deleted`
      log.error(error_description)
      return {
        // error: { status_code: 409, status_text: 'Conflict', error_description }
        error: new Error(error_description)
      }
    }

    const result = await api.move({
      base_url,
      committer,
      path_before: loc.store,
      path_after: loc.store_deleted,
      owner,
      repo,
      token
    })

    if (result.error) {
      return { error: new Error(result.error.error_description) }
    } else {
      return { value: result.value }
    }
  }

  return softDelete
}
