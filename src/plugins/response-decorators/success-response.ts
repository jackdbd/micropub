import type { FastifyReply } from 'fastify'
import { APPLICATION_JSON, TEXT_HTML } from '../../lib/content-type.js'
import { clientAcceptsHtml } from '../../lib/fastify-request-predicates/index.js'

export interface BaseSuccessResponseBody {
  description?: string
  payload?: any
  summary: string
  title?: string
}

export function successResponse<
  B extends BaseSuccessResponseBody = BaseSuccessResponseBody
>(this: FastifyReply, code: number, body: B) {
  const { payload, summary } = body
  const title = body.title || 'Success'
  const description = body.description || 'Success page'

  if (clientAcceptsHtml(this.request)) {
    this.header('Content-Type', TEXT_HTML)
    return this.code(code).view('success.njk', {
      title,
      description,
      summary,
      payload
    })
  } else {
    this.header('Content-Type', APPLICATION_JSON)
    if (payload) {
      return this.code(code).send(payload)
    } else {
      return this.code(204).send()
    }
  }
}
