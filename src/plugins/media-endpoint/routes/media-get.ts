import type { RouteHandler } from 'fastify'
import type { MediaStore } from '../../../lib/micropub/index.js'

interface Config {
  store: MediaStore
}

export const defMediaGet = (config: Config) => {
  const { store } = config

  const mediaGet: RouteHandler = async (_request, reply) => {
    // store capabilities
    const supports_delete = store.delete ? true : false
    const capabilities = { supports_upload: true, supports_delete }

    return reply.successResponse(200, {
      title: 'Media endpoint configuration',
      description: 'Configuration page for the media endpoint.',
      summary: 'Configuration for the Micropub media endpoint.',
      payload: { info: store.info, capabilities }
    })
  }

  return mediaGet
}
