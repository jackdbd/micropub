import type { FastifyReply } from 'fastify'
import { APPLICATION_JSON, TEXT_HTML } from '../../lib/content-type.js'
import { clientAcceptsHtml } from '../../lib/fastify-request-predicates/index.js'
import {
  AuthorizationErrorResponseBody,
  TokenErrorResponseBody
} from './error.js'

export function tokenErrorResponse(
  this: FastifyReply,
  code: number,
  body: TokenErrorResponseBody
) {
  // Either passing base_url to the nunjucks template or not is fine. But if we
  // do pass it, we need to make sure to specify 'https' when we're not on
  // localhost, otherwise we will have mixed content errors.

  // const base_url =
  //   this.request.hostname === 'localhost'
  //     ? `http://${this.request.host}`
  //     : `https://${this.request.host}`

  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    const title = body.error ? `Token Error: ${body.error}` : 'Token Error'

    const message = body.error_description || 'Your request was not successful.'

    this.header('Content-Type', TEXT_HTML)

    return this.view('error.njk', {
      // base_url,
      description: 'IndieAuth token endpoint error page',
      message,
      title
    })
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}

// TODO: move to authorization-endpoint plugin
export function authorizationErrorResponse(
  this: FastifyReply,
  code: number,
  body: AuthorizationErrorResponseBody
) {
  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    const title = body.error
      ? `Authorization Error: ${body.error}`
      : 'Authorization Error'

    const message = body.error_description || 'Your request was not successful.'

    this.header('Content-Type', TEXT_HTML)

    return this.view('error.njk', {
      description: 'IndieAuth authorization endpoint error page',
      message,
      title
    })
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}
