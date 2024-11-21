import type { FastifyRequest } from 'fastify'

export const clientAcceptsHtml = (request: FastifyRequest) => {
  if (request.headers.accept && request.headers.accept.includes('text/html')) {
    return true
  } else {
    return false
  }
}
