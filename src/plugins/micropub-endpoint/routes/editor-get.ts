import type { RouteHandler } from 'fastify'

export interface Config {
  log_prefix: string
  submit_endpoint: string
}

export const defEditor = (config: Config) => {
  const { log_prefix, submit_endpoint } = config

  const editor: RouteHandler = (request, reply) => {
    const access_token = request.session.get('access_token')

    if (!access_token) {
      request.log.debug(
        `${log_prefix}access token not found in session (you must sign in)`
      )
      request.log.debug(`${log_prefix}redirect to /login`)
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
