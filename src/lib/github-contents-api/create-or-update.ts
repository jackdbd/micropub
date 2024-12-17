import { applyToDefaults } from '@hapi/hoek'
import type { AuthorOrCommitter, SharedConfig } from './config.js'
import { BASE_URL, REF } from './defaults.js'
import { internalServerError } from './errors.js'
import { defHeaders } from './headers.js'

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
      headers: defHeaders({ token })
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
