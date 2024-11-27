import type { FastifyReply } from 'fastify'
import { APPLICATION_JSON, TEXT_HTML } from '../content-type.js'
import { clientAcceptsHtml } from '../fastify-request-predicates/index.js'

export interface BaseErrorResponseBody {
  error: string
  error_description?: string
}

export function errorResponse<
  B extends BaseErrorResponseBody = BaseErrorResponseBody
>(this: FastifyReply, code: number, body: B) {
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
      error: body.error,
      error_description: body.error_description,
      description: 'Error page',
      title: `Error: ${body.error}`
    })
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}
