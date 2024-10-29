// https://indieauth.spec.indieweb.org/#error-responses

export const invalid_request = {
  code: 400,
  payload: (error_description?: string) => {
    return {
      error: 'invalid_request',
      error_description
    }
  }
}

export const invalid_authorization = {
  code: 401,
  payload: (error_description?: string) => {
    return {
      error: 'invalid_authorization',
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

export const insufficient_scope = {
  code: 403,
  payload: (error_description?: string) => {
    return {
      error: 'insufficient_scope',
      error_description
    }
  }
}
