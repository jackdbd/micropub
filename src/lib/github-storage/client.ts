import { applyToDefaults } from '@hapi/hoek'
import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import type {
  Create,
  DeleteContentOrMedia,
  Get,
  Undelete,
  Update
} from '../../lib/schemas/index.js'
import { rfc3339 } from '../date.js'
import { base64ToUtf8, utf8ToBase64 } from '../encoding.js'
import * as api from '../github-contents-api/index.js'
import type {
  AuthorOrCommitter,
  GetResponseBody
} from '../github-contents-api/index.js'
import {
  BASE_URL as GITHUB_API_BASE_URL,
  REF
} from '../github-contents-api/defaults.js'
import { markdownToJf2 } from '../markdown-to-jf2.js'
import {
  jf2ToContentWithFrontmatter,
  jf2ToSlug,
  type Publication
} from '../micropub/index.js'

interface Log {
  debug: (...args: any) => void
  error: (...args: any) => void
}

/**
 * Configuration options for the GitHub store.
 *
 * **Note**: We could retrieve name and email from the GitHub token by making an
 * authenticated request to https://api.github.com/user, but then we would need
 * to `await` the function that creates the store.
 */
export interface Config {
  author?: AuthorOrCommitter
  branch?: string
  committer: AuthorOrCommitter
  github_api_base_url?: string
  log?: Log
  owner: string
  publication: Publication
  repo: string
  soft_delete: boolean
  token?: string
}

const defaults: Partial<Config> = {
  branch: REF,
  github_api_base_url: GITHUB_API_BASE_URL,
  log: {
    debug: console.debug,
    error: console.error
  },
  token: process.env.GITHUB_TOKEN
}

export const defGitHub = (config: Config) => {
  const store_cfg = applyToDefaults(defaults, config) as Required<Config>

  const {
    branch,
    committer,
    github_api_base_url: base_url,
    log,
    owner,
    publication,
    repo,
    token
  } = store_cfg

  const author = config.author || committer

  const info = {
    author,
    branch,
    committer,
    name: `GitHub repository ${owner}/${repo}`,
    publication
    // const entries = Object.entries(publication.items).map(([key, item]) => {
    //   const loc = item.location
    //   return {
    //     key,
    //     store: loc.store,
    //     store_deleted: loc.store_deleted,
    //     website: loc.website
    //   }
    // })

    // // return entries // for console.table

    // const xs = [
    //   `=== GitHub store info ===`,
    //   `Name: ${name}`,
    //   `Publications:`,
    //   JSON.stringify(entries, null, 2),
    //   `Posts will be committed by ${committer.name} on branch ${branch}`,
    //   `Posts will be authored by ${author.name}`,
    //   `=== END OF STORE INFO ===`
    // ]
    // return xs.join('\n')
  }

  const update: Update = async (url, patch) => {
    const loc = publishedUrlToStoreLocation(url)

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

  const get: Get = async (loc) => {
    const result = await api.get({
      base_url,
      owner,
      path: loc.store,
      repo,
      token
    })

    if (result.error) {
      return { error: new Error(result.error.error_description) }
    } else {
      const { content: base64, sha } = result.value.body
      const jf2 = markdownToJf2(base64ToUtf8(base64))
      return { value: { jf2, sha } }
    }
  }

  const hardDelete: DeleteContentOrMedia = async (url) => {
    const loc = publishedUrlToStoreLocation(url)

    const result_get = await get(loc)

    if (result_get.error) {
      // In this case the original error message from the GitHub Contents API is
      // not that useful.
      // const { error_description: original } = result_get.error
      const tip = `Please make sure the post exists in the repository.`
      const error_description = `Cannot delete post published at ${loc.website} because it could not be retrieved from location ${loc.store} in repository ${owner}/${repo} (branch ${branch}). ${tip}`
      // return { error: { ...result_get.error, error_description } }
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
      // return { error: { ...result.error, error_description } }
      return { error: new Error(error_description) }
    } else {
      const summary = `Deleted ${loc.store} in repository ${owner}/${repo} (branch ${branch}). That post was published at ${loc.website}.`
      log.debug(summary)
      return { value: { ...result.value, summary } }
    }
  }

  const softDelete: DeleteContentOrMedia = async (url) => {
    const loc = publishedUrlToStoreLocation(url)

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

  const undelete: Undelete = async (url) => {
    const loc = publishedUrlToStoreLocation(url)

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
      // return { error: { ...result.error, error_description } }
      return { error: new Error(error_description) }
    } else {
      return { value: result.value }
    }
  }

  // The GitHub Contents API requires content to be Base64-encoded.
  const jf2ToContent = (jf2: Jf2) => {
    const content = jf2ToContentWithFrontmatter(jf2)
    return utf8ToBase64(content)
  }

  /**
   * E.g. of a note published on my website: https://www.giacomodebidda.com/notes/test-note/
   */
  const publishedUrlToStoreLocation = (url: string) => {
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

  return {
    create,
    delete: store_cfg.soft_delete ? softDelete : hardDelete,
    get,
    jf2ToContent,
    info,
    publishedUrlToStoreLocation,
    undelete: store_cfg.soft_delete ? undelete : undefined,
    update
  }
}
