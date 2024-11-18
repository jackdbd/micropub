import { applyToDefaults } from '@hapi/hoek'
import * as api from './api.js'
import type { AuthorOrCommitter } from './api.js'
import { BASE_URL, DELETED_PREFIX, REF } from './defaults.js'

export interface Options {
  author?: AuthorOrCommitter
  base_url?: string
  branch?: string
  committer: AuthorOrCommitter
  deleted_prefix?: string
  owner: string
  repo: string
  token?: string
}

export interface CreateConfig {
  content: string // Base64-encoded content
  path: string
}

export interface UpdateConfig {
  content: string // Base64-encoded content
  path: string
  sha: string
}

export interface GetConfig {
  path: string
}

export interface HardDeleteConfig {
  path: string
  sha: string
}

export interface SoftDeleteConfig {
  path: string
}

export interface UndeleteConfig {
  path: string
}

interface PublishedUrlToStoreLocationConfig {
  url: string
  deleted?: boolean
}

const store_defaults: Partial<Options> = {
  base_url: BASE_URL,
  branch: REF,
  deleted_prefix: DELETED_PREFIX,
  token: process.env.GITHUB_TOKEN
}

export const defStore = (options: Options) => {
  const config = applyToDefaults(store_defaults, options) as Required<Options>

  const { base_url, branch, committer, deleted_prefix, owner, repo, token } =
    config
  const author = config.author || committer

  const create = (cfg: CreateConfig) => {
    const { content, path } = cfg

    return api.createOrUpdate({
      author,
      base_url,
      branch,
      committer,
      content,
      owner,
      path,
      repo,
      token
    })
  }

  const update = (cfg: UpdateConfig) => {
    const { content, path, sha } = cfg

    return api.createOrUpdate({
      author,
      base_url,
      branch,
      committer,
      content,
      owner,
      path,
      repo,
      sha,
      token
    })
  }

  const get = (cfg: GetConfig) => {
    return api.get({
      base_url,
      owner,
      path: cfg.path,
      repo,
      token
    })
  }

  const hardDelete = (cfg: HardDeleteConfig) => {
    return api.hardDelete({
      base_url,
      committer,
      owner,
      path: cfg.path,
      repo,
      sha: cfg.sha,
      token
    })
  }

  const softDelete = (cfg: SoftDeleteConfig) => {
    const path_before = cfg.path
    const path_after = `${deleted_prefix}${cfg.path}`

    return api.move({
      base_url,
      committer,
      path_before,
      path_after,
      owner,
      repo,
      token
    })
  }

  const undelete = (cfg: UndeleteConfig) => {
    // const splits = cfg.path.split('/')
    const path_before = cfg.path
    const path_after = cfg.path.replace(deleted_prefix, '')

    return api.move({
      base_url,
      committer,
      path_before,
      path_after,
      owner,
      repo,
      token
    })
  }

  const publishedUrlToStoreLocation = (
    config: PublishedUrlToStoreLocationConfig
  ) => {
    const { url, deleted } = config
    // e.g. of a note published on my website:
    // https://www.giacomodebidda.com/notes/test-note/
    const [_domain, ...splits] = url.split('/').slice(2)
    // const naked_domain = domain.replace('www.', '')

    let path = splits.filter((s) => s !== '').join('/') + '.md'

    if (deleted) {
      path = `${deleted_prefix}${path}`
    }

    return path
  }

  return {
    create,
    update,
    delete: softDelete,
    get,
    hardDelete,
    undelete,
    publishedUrlToStoreLocation
  }
}
