import { applyToDefaults } from '@hapi/hoek'
import { ACCEPT, GITHUB_API_VERSION, REF } from './defaults.js'

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
  const opt = options || {}
  const api_version = opt.github_api_version || GITHUB_API_VERSION
  const token = opt.token || process.env.GITHUB_TOKEN

  return {
    accept: ACCEPT,
    'X-GitHub-Api-Version': api_version,
    authorization: `Bearer ${token}`
  }
}

const internalServerError = (err: any) => {
  return {
    message: err.message,
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
        message: `could not retrieve ${config.path} from repo ${owner}/${repo}, ref=${ref}`,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  }

  try {
    const body = await response.json()

    return {
      value: {
        message: `retrieved ${config.path} from repo ${owner}/${repo}, ref=${ref}`,
        body,
        status_code: response.status
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
        message: `could not update ${config.path} in repo ${owner}/${repo}`,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  }

  if (!sha && response.status !== 201) {
    return {
      error: {
        message: `could not create ${config.path} in repo ${owner}/${repo}`,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  }

  let message: string
  if (sha) {
    message = `updated ${config.path} in repo ${owner}/${repo}`
  } else {
    message = `created ${config.path} in repo ${owner}/${repo}`
  }

  try {
    const body = await response.json()
    // TODO: maybe consider returning just the link/url/permalink/location
    // instead of the entire response body.
    return {
      value: {
        message,
        body,
        status_code: response.status
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

  const { base_url, branch, committer, owner, path, repo, sha, token } = config
  const author = config.author || committer

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
        message: `could not delete ${path} from repo ${owner}/${repo}, branch=${branch}`,
        status_code: response.status,
        status_text: response.statusText
      }
    }
  }

  try {
    const body = await response.json()

    return {
      value: {
        message: `deleted ${path} in repo ${owner}/${repo}, branch=${branch}`,
        body,
        status_code: response.status
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
    return { error: result_create.error }
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
    result_create.value.message,
    result_hard_delete.value.message
  ]

  return {
    value: {
      message: messages.join('; '),
      status_code: 200
    }
  }
}