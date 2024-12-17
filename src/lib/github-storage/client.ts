import { applyToDefaults } from '@hapi/hoek'
import type { AuthorOrCommitter } from '../github-contents-api/index.js'
import {
  BASE_URL as GITHUB_API_BASE_URL,
  REF
} from '../github-contents-api/defaults.js'
import { type Publication } from '../micropub/index.js'
import { defCreate } from './create.js'
import { defGet } from './get.js'
import { defHardDelete } from './hard-delete.js'
import { jf2ToContent } from './jf2-to-content.js'
import { defPublishedUrlToStorageLocation } from './published-url-to-storage-location.js'
import { defSoftDelete } from './soft-delete.js'
import { defUndelete } from './undelete.js'
import { defUpdate } from './update.js'
import type { Log } from './log.js'

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

  const author = config.author ?? committer

  const info = {
    author,
    branch,
    committer,
    name: `GitHub repository ${owner}/${repo}`,
    publication
  }

  const publishedUrlToStorageLocation = defPublishedUrlToStorageLocation({
    log,
    publication
  })

  const create = defCreate({
    author,
    base_url,
    branch,
    committer,
    log,
    owner,
    publication,
    repo,
    token
  })

  const update = defUpdate({
    author,
    base_url,
    branch,
    committer,
    log,
    owner,
    publication,
    repo,
    token
  })

  const get = defGet({ base_url, owner, ref: branch, repo, token })

  const hardDelete = defHardDelete({
    base_url,
    branch,
    committer,
    log,
    owner,
    publication,
    repo,
    token
  })

  const softDelete = defSoftDelete({
    base_url,
    committer,
    log,
    owner,
    publication,
    repo,
    token
  })

  const undelete = defUndelete({
    base_url,
    committer,
    log,
    owner,
    publication,
    repo,
    token
  })

  return {
    create,
    delete: store_cfg.soft_delete ? softDelete : hardDelete,
    get,
    jf2ToContent,
    info,
    publishedUrlToStorageLocation,
    undelete: store_cfg.soft_delete ? undelete : undefined,
    update
  }
}
