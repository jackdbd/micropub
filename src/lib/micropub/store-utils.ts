import type { Store as MediaStore } from './media-store.js'
import type { Store } from './store.js'

export const errorIfMethodNotImplementedInStore = (
  store: Store | MediaStore,
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
