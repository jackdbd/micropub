import {
  FORBIDDEN,
  INVALID_REQUEST,
  UNAUTHORIZED
} from '../../lib/http-error.js'
import { BaseStoreError, BaseStoreValue } from '../../lib/micropub/index.js'

export const storeErrorToMicropubError = (err: BaseStoreError = {}) => {
  const status_code: number = err.status_code || INVALID_REQUEST.code

  const error_description = err.error_description

  switch (status_code) {
    case 400: {
      const error = err.status_text || INVALID_REQUEST.error
      return { code: 400, body: { error, error_description } }
    }
    case 401: {
      const error = err.status_text || UNAUTHORIZED.error
      return { code: 401, body: { error, error_description } }
    }
    case 403: {
      const error = err.status_text || FORBIDDEN.error
      return { code: 403, body: { error, error_description } }
    }
    default: {
      const error = err.status_text || INVALID_REQUEST.error
      const code = err.status_code || INVALID_REQUEST.code
      return { code, body: { error, error_description } }
    }
  }
}

/**
 * The store value comes from the code that implements the store interface,
 * which could be code outside of this Fastify plugin. It's better to normalize
 * it.
 */
export const storeValueToMicropubValue = (value: BaseStoreValue = {}) => {
  const code: number = value.status_code || 200
  const status_text: string = value.status_text || 'Success'
  const summary: string = value.summary || 'Your request succeeded.'
  const payload = value.payload || undefined
  return { code, payload, status_text, summary }
}
