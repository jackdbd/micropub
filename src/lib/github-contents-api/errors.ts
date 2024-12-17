export const internalServerError = (err: any) => {
  return {
    error_description: err.message,
    status_code: 500,
    status_text: 'Internal Server Error'
  }
}
