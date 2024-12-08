import type { RouteHandler } from 'fastify'

export interface Config {
  prefix: string
  submit_endpoint: string
}

export const defEditor = (config: Config) => {
  const { prefix, submit_endpoint } = config

  const editor: RouteHandler = (request, reply) => {
    const access_token = request.session.get('access_token')

    if (!access_token) {
      request.log.debug(
        `${prefix}key 'access_token' not found in session or it is undefined`
      )
      request.log.debug(`${prefix}redirect to /login`)
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
