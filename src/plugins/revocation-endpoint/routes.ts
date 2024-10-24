import type { RouteHandler } from 'fastify'

export const revocation: RouteHandler = async (_request, reply) => {
  return reply.send({ todo: 'implement token revocation' })
}
