import {
  forbidden,
  invalidRequest,
  unauthorized
} from '../../lib/micropub/index.js'

const DEFAULT_INCLUDE_ERROR_DESCRIPTION = false

const DEFAULT_STATUS_CODE_ERROR = 400
const DEFAULT_STATUS_CODE_SUCCESS = 200

interface Options {
  include_error_description?: boolean
}

export const storeErrorToMicropubError = (err: any, options?: Options) => {
  const opt = options ?? {}

  const include_error_description =
    opt.include_error_description ?? DEFAULT_INCLUDE_ERROR_DESCRIPTION

  const error_description =
    err.message ?? 'There was an error with the Micropub store.'

  // I can't rely on a status code being returned by a store. Probably this
  // switch is not a good idea.
  const status_code = err.status_code ?? DEFAULT_STATUS_CODE_ERROR

  switch (status_code) {
    case 400: {
      return invalidRequest({ error_description, include_error_description })
    }
    case 401: {
      return unauthorized({ error_description, include_error_description })
    }
    case 403: {
      return forbidden({ error_description, include_error_description })
    }
    default: {
      return invalidRequest({ error_description, include_error_description })
    }
  }
}

/**
 * The store value comes from the code that implements the store interface,
 * which could be code outside of this Fastify plugin. It's better to normalize
 * it.
 */
export const storeValueToMicropubValue = (value: any = {}) => {
  const code = value.status_code || DEFAULT_STATUS_CODE_SUCCESS
  const status_text: string = value.status_text || 'Success'
  const summary: string = value.summary || 'Your request succeeded.'
  const payload = value.payload || undefined
  return { code, payload, status_text, summary }
}
