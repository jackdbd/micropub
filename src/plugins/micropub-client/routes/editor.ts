import type { RouteHandler } from 'fastify'

export interface Config {
  submit_endpoint: string
}

export const defEditor = (config: Config) => {
  const { submit_endpoint } = config

  const editor: RouteHandler = (_request, reply) => {
    return reply.view('editor.njk', {
      description: 'Editor page',
      submit_endpoint,
      title: 'Editor'
    })
  }

  return editor
}
