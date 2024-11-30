import type { ContentStore, MediaStore, SyndicatorStore } from './interface.js'

export const errorIfMethodNotImplementedInStore = (
  store: ContentStore | MediaStore | SyndicatorStore,
  method: string
) => {
  if (!(store as any)[method]) {
    const code = 501
    const body = {
      error: 'Not Implemented',
      error_description: `Store ${store.info.name} does not implement '${method}'.`
    }
    return { code, body }
  }
}
