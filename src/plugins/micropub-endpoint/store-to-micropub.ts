import {
  ForbiddenError,
  InvalidRequestError,
  UnauthorizedError
} from '../../lib/fastify-errors/index.js'

const DEFAULT_STATUS_CODE_ERROR = 400
const DEFAULT_STATUS_CODE_SUCCESS = 200

export const storeErrorToMicropubError = (err: any) => {
  const error_description =
    err.message ?? 'There was an error with the Micropub store.'

  // I can't rely on a status code being returned by a store. Probably this
  // switch is not a good idea.
  const status_code = err.status_code ?? DEFAULT_STATUS_CODE_ERROR

  switch (status_code) {
    case 400: {
      return new InvalidRequestError({ error_description })
    }
    case 401: {
      return new UnauthorizedError({ error_description })
    }
    case 403: {
      return new ForbiddenError({ error_description })
    }
    default: {
      return new InvalidRequestError({ error_description })
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
