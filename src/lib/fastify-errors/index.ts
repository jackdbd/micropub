import type { FastifyError } from '@fastify/error'
// import type { ErrorType } from '../../lib/indieauth/index.js'
// import type { ErrorType } from '../../lib/micropub/index.js'
// import type { ErrorType } from '../../lib/oauth2/index.js'

// https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
// https://indieauth.spec.indieweb.org/#error-responses
// https://micropub.spec.indieweb.org/#error-response

export interface ErrorData {
  error_description: string
  error_uri?: string
  state?: string
}

class BaseError extends Error implements FastifyError {
  public readonly code: string
  public readonly statusCode: number
  public readonly error: string
  public readonly error_description?: string
  public readonly error_uri?: string
  public readonly state?: string

  constructor(
    code: string,
    error: string,
    statusCode: number,
    name: string,
    data: ErrorData
  ) {
    // const message = error
    const message = `${error}: ${data.error_description}`
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.error = error
    this.error_description = data.error_description
    this.error_uri = data.error_uri
    this.state = data.state
    this.name = name
  }
}

export class InvalidRequestError extends BaseError {
  constructor(data: ErrorData) {
    super(
      'FST_ERR_INVALID_REQUEST',
      'invalid_request',
      400,
      'Invalid Request',
      data
    )
  }
}

// I think it should return HTTP 400 Bad Request. That's how they do here:
// https://github.com/oauthjs/node-oauth2-server/blob/master/docs/api/errors/unsupported-response-type-error.rst
export class UnsupportedResponseTypeError extends BaseError {
  constructor(data: ErrorData) {
    super(
      'FST_ERR_UNSUPPORTED_RESPONSE_TYPE',
      'unsupported_response_type',
      400,
      'Unsupported Response Type',
      data
    )
  }
}

export class InvalidTokenError extends BaseError {
  constructor(data: ErrorData) {
    super('FST_ERR_INVALID_TOKEN', 'invalid_token', 401, 'Invalid Token', data)
  }
}

export class UnauthorizedError extends BaseError {
  constructor(data: ErrorData) {
    super('FST_ERR_UNAUTHORIZED', 'unauthorized', 401, 'Unauthorized', data)
  }
}

export class UnauthorizedClientError extends BaseError {
  constructor(data: ErrorData) {
    super(
      'FST_ERR_UNAUTHORIZED_CLIENT',
      'unauthorized_client',
      401,
      'Unauthorized Client',
      data
    )
  }
}

export class InvalidScopeError extends BaseError {
  constructor(data: ErrorData) {
    super('FST_ERR_INVALID_SCOPE', 'invalid_scope', 401, 'Invalid Scope', data)
  }
}

export class ForbiddenError extends BaseError {
  constructor(data: ErrorData) {
    super('FST_ERR_FORBIDDEN', 'forbidden', 403, 'Forbidden', data)
  }
}

export class AccessDeniedError extends BaseError {
  constructor(data: ErrorData) {
    super('FST_ERR_ACCESS_DENIED', 'access_denied', 403, 'Access Denied', data)
  }
}

export class InsufficientScopeError extends BaseError {
  constructor(data: ErrorData) {
    super(
      'FST_ERR_INSUFFICIENT_SCOPE',
      'insufficient_scope',
      403,
      'Insufficient Scope',
      data
    )
  }
}

export class ServerError extends BaseError {
  constructor(data: ErrorData) {
    super('FST_ERR_SERVER_ERROR', 'server_error', 500, 'Server Error', data)
  }
}

export class TemporaryUnavailableError extends BaseError {
  constructor(data: ErrorData) {
    super(
      'FST_ERR_TEMPORARILY_UNAVAILABLE',
      'temporarily_unavailable',
      503,
      'Temporarily Unavailable',
      data
    )
  }
}
