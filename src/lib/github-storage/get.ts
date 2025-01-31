import { applyToDefaults } from '@hapi/hoek'
import type { Get } from '../../lib/schemas/index.js'
import { base64ToUtf8 } from '../encoding.js'
import {
  BASE_URL,
  GITHUB_TOKEN,
  REF
} from '@jackdbd/github-contents-api/defaults'
import * as api from '@jackdbd/github-contents-api'
import { markdownToJf2 } from '../markdown-to-jf2.js'

export interface Options {
  base_url?: string
  owner?: string
  ref?: string
  repo?: string
  token?: string
}

const defaults: Partial<Options> = {
  base_url: BASE_URL,
  ref: REF,
  token: GITHUB_TOKEN
}

export const defGet = (options?: Options) => {
  const config = applyToDefaults(defaults, options ?? {}) as Required<Options>

  const { base_url, owner, ref, repo, token } = config

  const get: Get = async (loc) => {
    const result = await api.get({
      base_url,
      owner,
      path: loc.store,
      ref,
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

  return get
}
