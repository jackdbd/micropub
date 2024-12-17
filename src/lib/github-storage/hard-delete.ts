import { applyToDefaults } from '@hapi/hoek'
import type { DeleteContentOrMedia } from '../../lib/schemas/index.js'
import type {
  AuthorOrCommitter,
  GetResponseBody
} from '../github-contents-api/index.js'
import { BASE_URL, GITHUB_TOKEN, REF } from '../github-contents-api/defaults.js'
import * as api from '../github-contents-api/index.js'
import type { Log } from './log.js'
import type { Publication } from '../micropub/index.js'
import { defGet } from './get.js'
import { defPublishedUrlToStorageLocation } from './published-url-to-storage-location.js'

export interface Options {
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

export const defHardDelete = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const { base_url, branch, committer, log, owner, publication, repo, token } =
    config

  const publishedUrlToStorageLocation = defPublishedUrlToStorageLocation({
    log,
    publication
  })

  const get = defGet({ base_url, owner, ref: branch, repo, token })

  const hardDelete: DeleteContentOrMedia = async (url) => {
    const loc = publishedUrlToStorageLocation(url)

    const result_get = await get(loc)

    if (result_get.error) {
      // In this case the original error message from the GitHub Contents API is
      // not that useful.
      // const { error_description: original } = result_get.error
      const tip = `Please make sure the post exists in the repository.`
      const error_description = `Cannot delete post published at ${loc.website} because it could not be retrieved from location ${loc.store} in repository ${owner}/${repo} (branch ${branch}). ${tip}`
      return { error: new Error(error_description) }
    }

    const body = result_get.value as any
    const { sha } = body as GetResponseBody

    const result = await api.hardDelete({
      base_url,
      committer,
      owner,
      path: loc.store,
      repo,
      sha,
      token
    })

    if (result.error) {
      const tip = `Make sure you have the permissions to delete files from the respository.`
      const error_description = `Cannot delete post published at ${loc.website} because it could not be deleted from location ${loc.store} in repository ${owner}/${repo} (branch ${branch}). ${tip}`
      return { error: new Error(error_description) }
    } else {
      const summary = `Deleted ${loc.store} in repository ${owner}/${repo} (branch ${branch}). That post was published at ${loc.website}.`
      log.debug(summary)
      return { value: { ...result.value, summary } }
    }
  }

  return hardDelete
}
