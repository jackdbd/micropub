import { applyToDefaults } from '@hapi/hoek'
import type { SharedConfig } from './config.js'
import { BASE_URL, REF } from './defaults.js'
import { internalServerError } from './errors.js'
import { defHeaders } from './headers.js'

export interface GetResponseBody {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  content: string
  encoding: 'base64'
  _links: {
    self: string
    git: string
    html: string
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
