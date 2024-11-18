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
