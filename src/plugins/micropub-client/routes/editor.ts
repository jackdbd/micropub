import type { RouteHandler } from 'fastify'

export interface Config {
  submitEndpoint: string
}

export const defEditor = (config: Config) => {
  const { submitEndpoint } = config

  const editor: RouteHandler = (request, reply) => {
    request.log.debug(`render editor.njk`)
    return reply.view('editor.njk', {
      description: 'Editor page',
      submit_endpoint: submitEndpoint,
      title: 'Editor'
    })
  }

  return editor
}
