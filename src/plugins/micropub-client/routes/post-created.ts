import type { RouteHandler } from 'fastify'

export const postCreated: RouteHandler = (request, reply) => {
  request.log.debug(`render post-created.njk`)
  return reply.view('post-created.njk', {
    description: 'Post created page',
    title: 'Post created',
    data: (request.query as any).data
  })
}
