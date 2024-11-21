import type { StoreError } from './store.js'

// https://micropub.spec.indieweb.org/#error-response

export const invalid_request = {
  code: 400,
  payload: (error_description?: string) => {
    return {
      error: 'invalid_request',
      error_description
    }
  }
}

export const invalid_token = {
  code: 401,
  payload: (error_description?: string) => {
    return {
      error: 'invalid_token',
      error_description
    }
  }
}

export const unauthorized = {
  code: 401,
  payload: (error_description?: string) => {
    return {
      error: 'unauthorized',
      error_description
    }
  }
}

export const forbidden = {
  code: 403,
  payload: (error_description?: string) => {
    return {
      error: 'forbidden',
      error_description
    }
  }
}

export const insufficient_scope = {
  code: 403,
  payload: (error_description?: string) => {
    return {
      error: 'insufficient_scope',
      error_description
    }
  }
}

export const mpError = (err: StoreError) => {
  let code: number
  let error: string
  if (err.status_code === 401 || err.status_code === 403) {
    code = err.status_code
    error = err.status_text
  } else {
    code = 400
    error = 'invalid_request'
  }

  const error_description = err.message

  return { code, error, error_description }
}
