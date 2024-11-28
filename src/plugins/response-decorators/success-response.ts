import type { FastifyReply } from 'fastify'
import { APPLICATION_JSON, TEXT_HTML } from '../../lib/content-type.js'
import { clientAcceptsHtml } from '../../lib/fastify-request-predicates/index.js'

export interface BaseSuccessResponseBody {
  title?: string
  description?: string
  summary: string
  payload?: any
}

export function successResponse<
  B extends BaseSuccessResponseBody = BaseSuccessResponseBody
>(this: FastifyReply, code: number, body: B) {
  const { summary, payload } = body
  const title = body.title || 'Success'
  const description = body.description || 'Success page'

  this.code(code)

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.view('success.njk', {
      title,
      description,
      summary,
      payload
    })
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    return this.send({ summary, payload })
  }
}
