import type { RouteHandler } from 'fastify'

export const userinfo: RouteHandler = async (_request, reply) => {
  return reply.send({ todo: 'implement userinfo endpoint' })
}
