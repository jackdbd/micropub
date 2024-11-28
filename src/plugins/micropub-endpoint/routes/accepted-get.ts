import type { RouteHandler } from 'fastify'

export const postAccepted: RouteHandler = (request, reply) => {
  return reply.view('post-accepted.njk', {
    description: 'Post accepted page',
    title: 'Post accepted',
    data: (request.query as any).data
  })
}
