import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export const statusCode = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  return error.statusCode || reply.statusCode || request.raw.statusCode || 500
}
