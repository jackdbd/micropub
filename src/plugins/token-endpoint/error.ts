// TODO: move to authorization-endpoint plugin
export interface AuthorizationErrorResponseBody {
  error: string
  error_description?: string
}

export interface TokenErrorResponseBody {
  error: string
  error_description?: string
}
