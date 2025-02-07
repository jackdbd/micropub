import type { FastifyReply } from 'fastify'
import { APPLICATION_JSON, TEXT_HTML } from '../../../lib/content-type.js'
import { clientAcceptsHtml } from '../../../lib/fastify-request-predicates/index.js'

export interface BaseErrorResponseBody {
  description?: string
  error: string
  error_description?: string
  error_uri?: string
  state?: string
  title?: string
}

const INVALID_REQUEST = {
  code: 400,
  error: 'invalid_request'
}

const UNAUTHORIZED = {
  code: 401,
  error: 'unauthorized'
}

// https://indieauth.spec.indieweb.org/#error-responses
const INVALID_TOKEN = {
  code: 401,
  error: 'invalid_token'
}

const FORBIDDEN = {
  code: 403,
  error: 'forbidden'
}

const INSUFFICIENT_SCOPE = {
  code: 403,
  error: 'insufficient_scope'
}

const LOG_PREFIX = '[micropub-client/error-response] '

export function errorResponse<
  B extends BaseErrorResponseBody = BaseErrorResponseBody
>(this: FastifyReply, code: number, body: B) {
  const title = body.title || 'Error'
  const description = body.description || 'Error page'
  const error_description = body.error_description
  const error_uri = body.error_uri
  const state = body.state

  this.request.log.error(
    `${LOG_PREFIX}${body.error}: ${body.error_description}`
  )

  // TODO: handle i18n here?
  let error: string
  switch (body.error) {
    case FORBIDDEN.error: {
      error = 'Forbidden'
      break
    }
    case INSUFFICIENT_SCOPE.error: {
      error = 'Insufficient scope'
      break
    }
    case INVALID_REQUEST.error: {
      error = 'Invalid request'
      break
    }
    case INVALID_TOKEN.error: {
      error = 'Invalid token'
      break
    }
    case UNAUTHORIZED.error: {
      error = 'Unauthorized'
      break
    }
    default: {
      error = body.error
    }
  }

  // Either passing base_url to the nunjucks template or not is fine. But if we
  // do pass it, we need to make sure to specify 'https' when we're not on
  // localhost, otherwise we will have mixed content errors.

  // const base_url =
  //   this.request.hostname === 'localhost'
  //     ? `http://${this.request.host}`
  //     : `https://${this.request.host}`

  // const base_url =
  //   this.request.hostname === 'localhost'
  //     ? undefined
  //     : `https://${this.request.host}`

  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.view('error.njk', {
      title,
      description,
      error,
      error_description,
      error_uri,
      state
    })
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send({ error, error_description, error_uri, state })
  }
}
