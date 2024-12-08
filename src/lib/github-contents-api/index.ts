import { applyToDefaults } from '@hapi/hoek'
import * as DEFAULT from '../../defaults.js'
import { ACCEPT, BASE_URL, GITHUB_API_VERSION, REF } from './defaults.js'
import type { GetResponseBody } from './interfaces.js'

export type { GetResponseBody }

export interface AuthorOrCommitter {
  name: string
  email: string
}

export interface SharedConfig {
  base_url: string
  owner: string
  repo: string
  token: string
}

interface HeadersOptions {
  github_api_version?: string
  token?: string
}

const headers = (options?: HeadersOptions) => {
  const opt = options ?? {}
  const api_version = opt.github_api_version ?? GITHUB_API_VERSION
  const token = opt.token ?? DEFAULT.GITHUB_TOKEN

  return {
    accept: ACCEPT,
    'X-GitHub-Api-Version': api_version,
    authorization: `Bearer ${token}`
  }
}

const internalServerError = (err: any) => {
  return {
    error_description: err.message,
    status_code: 500,
    status_text: 'Internal Server Error'
  }
}

export interface GetOptions extends SharedConfig {
  /**
   * If you omit the path parameter, you will receive the contents of the repository's root directory.
   */
  path?: string

  /**
   * The name of the commit/branch/tag.
   */
  ref?: string
}

const get_defaults: Partial<GetOptions> = {
  base_url: BASE_URL,
  path: '',
  ref: REF
}

/**
 * Gets the contents of a file or directory in a repository.
 *
 * @see https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
 */
export const get = async (options: GetOptions) => {
  const config = applyToDefaults(get_defaults, options) as Required<GetOptions>

  const { base_url, owner, path, ref, repo, token } = config

  const endpoint = `/repos/${owner}/${repo}/contents/${path}`
  const url = `${base_url}${endpoint}?ref=${ref}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: headers({ token })
    })
  } catch (err: any) {
    return {
      error: internalServerError(err)
    }
  }

  if (response.status !== 200) {
    return {
      error: {
        error_description: `could not retrieve ${config.path} from repo ${owner}/${repo}, ref=${ref}`,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  }

  try {
    const body: GetResponseBody = await response.json()

    return {
      value: {
        summary: `retrieved ${config.path} from repo ${owner}/${repo}, ref=${ref}`,
        body,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  } catch (err: any) {
    return {
      error: internalServerError(err)
    }
  }
}

export interface CreateOrUpdateOptions extends SharedConfig {
  author?: AuthorOrCommitter
  branch?: string
  committer: AuthorOrCommitter
  content: string // Base64-encoded content
  path: string
  sha?: string
}

const create_or_update_defaults: Partial<CreateOrUpdateOptions> = {
  base_url: BASE_URL,
  branch: REF,
  path: ''
}

/**
 * Creates a new file or replaces an existing file in a repository.
 *
 * @see https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
 */
export const createOrUpdate = async (options: CreateOrUpdateOptions) => {
  const config = applyToDefaults(
    create_or_update_defaults,
    options
  ) as Required<CreateOrUpdateOptions>

  const {
    base_url,
    branch,
    committer,
    content,
    owner,
    path,
    repo,
    sha,
    token
  } = config
  const author = config.author || committer

  const endpoint = `/repos/${owner}/${repo}/contents/${path}`
  const url = `${base_url}${endpoint}`

  const shared = {
    author,
    branch,
    owner,
    repo,
    path,
    committer,
    content
  }

  let body: Record<string, any>
  if (sha) {
    body = { ...shared, message: `update ${path}`, sha }
  } else {
    body = { ...shared, message: `create ${path}` }
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: headers({ token })
    })
  } catch (err: any) {
    return {
      error: internalServerError(err)
    }
  }

  if (sha && response.status !== 200) {
    return {
      error: {
        error_description: `could not update ${config.path} in repo ${owner}/${repo}`,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  }

  if (!sha && response.status !== 201) {
    return {
      error: {
        error_description: `could not create ${config.path} in repo ${owner}/${repo}`,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  }

  let summary: string
  if (sha) {
    summary = `updated ${config.path} in repo ${owner}/${repo}`
  } else {
    summary = `created ${config.path} in repo ${owner}/${repo}`
  }

  try {
    const body = await response.json()
    // TODO: maybe consider returning just the link/url/permalink/location
    // instead of the entire response body.
    return {
      value: {
        summary,
        body,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  } catch (err: any) {
    return {
      error: internalServerError(err)
    }
  }
}

export interface DeleteOptions extends SharedConfig {
  author?: AuthorOrCommitter
  branch?: string
  committer: AuthorOrCommitter
  path?: string
  sha: string
}

const delete_defaults: Partial<DeleteOptions> = {
  base_url: BASE_URL,
  branch: REF,
  path: ''
}

/**
 * Deletes a file in a repository.
 *
 * @see: https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#delete-a-file
 */
export const hardDelete = async (options: DeleteOptions) => {
  const config = applyToDefaults(
    delete_defaults,
    options
  ) as Required<DeleteOptions>

  const { base_url, branch, committer, owner, path, repo, token } = config
  const author = config.author || committer

  let sha: string
  if (!config.sha) {
    const result_get = await get({
      base_url,
      path,
      ref: branch,
      owner,
      repo,
      token
    })

    if (result_get.error) {
      const original = result_get.error.error_description
      const error_description = `could not delete ${path} in repo ${owner}/${repo} because it couldn't be retrieved: ${original}`
      return { error: { ...result_get.error, error_description } }
    }

    sha = result_get.value.body.sha
  } else {
    sha = config.sha
  }

  const endpoint = `/repos/${owner}/${repo}/contents/${path}`
  const url = `${base_url}${endpoint}`

  const body = {
    author,
    branch,
    committer,
    message: `hard delete ${path}`,
    owner,
    path,
    repo,
    sha
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'DELETE',
      body: JSON.stringify(body),
      headers: headers({ token })
    })
  } catch (err: any) {
    return {
      error: internalServerError(err)
    }
  }

  if (response.status !== 200) {
    return {
      error: {
        error_description: `could not delete ${path} from repo ${owner}/${repo}, branch=${branch}`,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  }

  try {
    const body = await response.json()

    return {
      value: {
        summary: `deleted ${path} in repo ${owner}/${repo}, branch=${branch}`,
        body,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  } catch (err: any) {
    return {
      error: internalServerError(err)
    }
  }
}

export interface MoveOptions extends SharedConfig {
  author?: AuthorOrCommitter
  committer: AuthorOrCommitter
  path_before: string
  path_after: string
  ref?: string
}

const move_defaults: Partial<MoveOptions> = {
  base_url: BASE_URL,
  ref: REF
}

export const move = async (options: MoveOptions) => {
  const config = applyToDefaults(
    move_defaults,
    options
  ) as Required<MoveOptions>

  const {
    base_url,
    committer,
    owner,
    path_before,
    path_after,
    ref,
    repo,
    token
  } = config
  const author = config.author || committer

  const result_get = await get({
    base_url,
    owner,
    repo,
    token,
    path: path_before,
    ref
  })

  if (result_get.error) {
    return { error: result_get.error }
  }

  const { content, sha } = result_get.value.body

  const result_create = await createOrUpdate({
    author,
    base_url,
    branch: ref,
    committer,
    content,
    owner,
    path: path_after,
    repo,
    token
  })

  if (result_create.error) {
    const tip = `Make sure you can write to ${path_after}.`
    const error_description = `Cannot move ${path_before} to ${path_after} in repository ${owner}/${repo} on branch ${ref}. ${tip}`
    return { error: { ...result_create.error, error_description } }
  }

  const result_hard_delete = await hardDelete({
    base_url,
    branch: ref,
    committer,
    owner,
    path: path_before,
    repo,
    sha,
    token
  })

  if (result_hard_delete.error) {
    return { error: result_hard_delete.error }
  }

  const messages = [
    result_create.value.summary,
    result_hard_delete.value.summary
  ]

  return {
    value: {
      summary: messages.join('; '),
      status_code: 200,
      status_text: 'Success'
    }
  }
}
