import type { FastifyReply } from 'fastify'
import type {
  ClientErrorResponseBody,
  ClientErrorStatusCode
} from '../../../lib/micropub/index.js'
import { APPLICATION_JSON, TEXT_HTML } from '../../../lib/content-type.js'
import { clientAcceptsHtml } from '../../../lib/fastify-request-predicates/index.js'
import { errorPage } from '../../../lib/micropub-html-responses/index.js'

export function mediaErrorResponse(
  this: FastifyReply,
  code: ClientErrorStatusCode,
  body: ClientErrorResponseBody
) {
  const base_url = `${this.request.protocol}://${this.request.host}`

  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.send(errorPage({ ...body, base_url }))
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send(body)
  }
}
