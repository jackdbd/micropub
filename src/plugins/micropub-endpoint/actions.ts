import type { Store } from './store.js'
import {
  base64ToUtf8,
  markdownToMf2,
  mf2ToMarkdown,
  utf8ToBase64
} from './utils.js'

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
    let mf2 = markdownToMf2(md_original)

    const messages: string[] = []

    if (patch.delete) {
      const { [patch.delete]: _, ...keep } = mf2 as any
      messages.push(`deleted property ${patch.delete}`)
      mf2 = keep
    }

    if (patch.add) {
      messages.push(`added ${JSON.stringify(patch.add)}`)
      mf2 = { ...mf2, ...patch.add }
    }

    if (patch.replace) {
      messages.push(`replaced ${JSON.stringify(patch.replace)}`)
      mf2 = { ...mf2, ...patch.replace }
    }

    const md = mf2ToMarkdown(mf2)

    const content = utf8ToBase64(md)

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
