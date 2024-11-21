export const invalid_token = {
    code: 401,
    payload: (error_description?: string) => {
      return {
        error: 'invalid_token',
        error_description
      }
    }
  }
  