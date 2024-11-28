import type { RouteHandler } from 'fastify'

export interface Config {
  prefix: string
  submit_endpoint: string
}

export const defEditor = (config: Config) => {
  const { prefix, submit_endpoint } = config

  const editor: RouteHandler = (request, reply) => {
    const jwt = request.session.get('jwt')

    if (!jwt) {
      request.log.debug(
        `${prefix}Key 'jwt' not found in session or it is undefined. Redirecting to /login`
      )
      return reply.redirect('/login')
    }

    return reply.view('editor.njk', {
      description: 'Editor page',
      submit_endpoint,
      title: 'Editor'
    })
  }

  return editor
}
