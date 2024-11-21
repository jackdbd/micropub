import type { Store } from './store.js'
import { nowUTC } from '../../lib/date.js'
import { base64ToUtf8 } from '../../lib/encoding.js'
import { markdownToJf2 } from '../../lib/markdown-to-jf2.js'

export type ActionType = 'delete' | 'undelete' | 'update'

export interface UpdatePatch {
  delete?: string
  add?: Record<string, any>
  replace?: Record<string, any>
}

interface Config {
  store: Store
}

export const defDelete = (config: Config) => {
  const { store } = config

  return async function deleteAction(url: string) {
    const path = store.publishedUrlToStoreLocation({ url })
    return await store.delete({ path })
  }
}

export const defUndelete = (config: Config) => {
  const { store } = config

  return async function undeleteAction(url: string) {
    const path = store.publishedUrlToStoreLocation({ url, deleted: true })
    return await store.undelete({ path })
  }
}

export const defUpdate = (config: Config) => {
  const { store } = config

  return async function updateAction(url: string, patch: UpdatePatch) {
    const path = store.publishedUrlToStoreLocation({ url })
    const result_get = await store.get({ path })
    if (result_get.error) {
      return result_get
    }

    const { content: original, sha } = result_get.value.body

    const md_original = base64ToUtf8(original)
    let jf2 = markdownToJf2(md_original)

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
      jf2 = { ...jf2, updated: nowUTC() }
    }

    const content = store.jf2ToContent(jf2)

    // TODO: return update patch (a JSON object describing the changes that were
    // made.
    // https://micropub.spec.indieweb.org/#response-0-p-1

    return await store.update({
      path,
      content,
      sha
    })
  }
}

export const defActions = (config: Config) => {
  return {
    delete: defDelete(config),
    undelete: defUndelete(config),
    update: defUpdate(config)
  }
}
