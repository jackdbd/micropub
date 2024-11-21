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
