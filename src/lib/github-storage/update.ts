import { applyToDefaults } from '@hapi/hoek'
import {
  BASE_URL,
  GITHUB_TOKEN,
  REF
} from '@jackdbd/github-contents-api/defaults'
import type { AuthorOrCommitter } from '@jackdbd/github-contents-api'
import * as api from '@jackdbd/github-contents-api'
import type { Publication } from '@jackdbd/micropub'
import type { Update } from '../../lib/schemas/index.js'
import { rfc3339 } from '../date.js'
import { defGet } from './get.js'
import { jf2ToContent } from './jf2-to-content.js'
import type { Log } from './log.js'
import { defPublishedUrlToStorageLocation } from './published-url-to-storage-location.js'

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

export const defUpdate = (options?: Options) => {
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

  const publishedUrlToStorageLocation = defPublishedUrlToStorageLocation({
    log,
    publication
  })

  const get = defGet({ base_url, owner, ref: branch, repo, token })

  const update: Update = async (url, patch) => {
    const loc = publishedUrlToStorageLocation(url)

    // should we support updating a deleted post (loc.store_deleted)? Probably not.

    const result_get = await get(loc)

    if (result_get.error) {
      // const { status_code, status_text } = result_get.error
      const tip = `Make sure the file exists and that you can fetch it from the repository.`
      const error_description = `Cannot update the post published at ${loc.website} because the file ${loc.store} could not be retrieved from repository ${owner}/${repo} (branch ${branch}). ${tip}`
      // return { error: { status_code, status_text, error_description } }
      return { error: new Error(error_description) }
    }

    let jf2 = result_get.value.jf2
    const sha = result_get.value.sha

    const messages: string[] = []

    if (patch.delete) {
      const { [patch.delete]: _, ...keep } = jf2 as any
      messages.push(`deleted property ${patch.delete}`)
      jf2 = keep
    }

    if (patch.add) {
      messages.push(`added ${JSON.stringify(patch.add)}`)
      jf2 = { ...jf2, ...patch.add }
    }

    if (patch.replace) {
      messages.push(`replaced ${JSON.stringify(patch.replace)}`)
      jf2 = { ...jf2, ...patch.replace }
    }

    if (patch.add || patch.delete || patch.replace) {
      jf2 = { ...jf2, updated: rfc3339() }
    }

    const content = jf2ToContent(jf2)

    const result = await api.createOrUpdate({
      author,
      base_url,
      branch,
      committer,
      content,
      owner,
      path: loc.store,
      repo,
      sha,
      token
    })

    // TODO: return update patch (a JSON object describing the changes that were
    // made), not the content itself.
    // https://micropub.spec.indieweb.org/#response-0-p-1

    if (result.error) {
      return { error: new Error(result.error.error_description) }
    } else {
      const { status_code, status_text } = result.value
      const summary = `Updated ${loc.store} in repository ${owner}/${repo} (branch ${branch}). That post is published at ${loc.website}.`
      const payload = { messages, patch }
      return { value: { status_code, status_text, summary, payload } }
    }
  }

  return update
}
