import { applyToDefaults } from '@hapi/hoek'
import type { AuthorOrCommitter, SharedConfig } from './config.js'
import { BASE_URL, REF } from './defaults.js'
import { internalServerError } from './errors.js'
import { get } from './get.js'
import { defHeaders } from './headers.js'

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
      headers: defHeaders({ token })
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
