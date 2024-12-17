import { applyToDefaults } from '@hapi/hoek'
import type { AuthorOrCommitter, SharedConfig } from './config.js'
import { createOrUpdate } from './create-or-update.js'
import { BASE_URL, REF } from './defaults.js'
import { hardDelete } from './delete.js'
import { get } from './get.js'

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
